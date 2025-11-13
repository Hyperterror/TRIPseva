/**
 * Logging Utility
 * Centralized logging for the application
 * In production, integrate with services like Datadog, Sentry, or CloudWatch
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
  DEBUG = 'debug'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  endpoint?: string;
  stackTrace?: string;
  requestId?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      remoteEndpoint: process.env.LOG_ENDPOINT,
      ...config
    };
  }

  /**
   * Log a message with context
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Check if we should log this level
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(fullEntry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.bufferLog(fullEntry);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      context
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      context
    });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      context,
      stackTrace: error?.stack
    });
  }

  /**
   * Log critical error (requires immediate attention)
   */
  critical(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.CRITICAL,
      message,
      context,
      stackTrace: error?.stack
    });

    // In production, this should trigger alerts
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(message, error, context);
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      context
    });
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    endpoint: string,
    userId?: string,
    duration?: number,
    statusCode?: number
  ): void {
    this.info(`${method} ${endpoint}`, {
      userId,
      duration,
      statusCode,
      type: 'api_request'
    });
  }

  /**
   * Log API error
   */
  logApiError(
    method: string,
    endpoint: string,
    error: Error,
    userId?: string,
    statusCode?: number
  ): void {
    this.error(`${method} ${endpoint} failed`, error, {
      userId,
      statusCode,
      type: 'api_error',
      errorMessage: error.message
    });
  }

  /**
   * Log database operation
   */
  logDbOperation(
    operation: string,
    collection: string,
    duration?: number,
    error?: Error
  ): void {
    if (error) {
      this.error(`DB ${operation} on ${collection} failed`, error, {
        operation,
        collection,
        duration,
        type: 'db_error'
      });
    } else {
      this.debug(`DB ${operation} on ${collection}`, {
        operation,
        collection,
        duration,
        type: 'db_operation'
      });
    }
  }

  /**
   * Log external API call
   */
  logExternalApi(
    service: string,
    endpoint: string,
    duration?: number,
    success?: boolean,
    error?: Error
  ): void {
    if (error || !success) {
      this.error(`External API ${service} failed`, error, {
        service,
        endpoint,
        duration,
        type: 'external_api_error'
      });
    } else {
      this.info(`External API ${service} called`, {
        service,
        endpoint,
        duration,
        type: 'external_api_call'
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    userId?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR : 
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.log({
      level,
      message: `Security Event: ${event}`,
      userId,
      context: {
        ...context,
        type: 'security_event',
        severity
      }
    });
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const minIndex = levels.indexOf(this.config.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const userStr = entry.userId ? ` [User: ${entry.userId}]` : '';
    const endpointStr = entry.endpoint ? ` [${entry.endpoint}]` : '';

    const message = `${prefix}${userStr}${endpointStr} ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message);
        if (entry.stackTrace) {
          console.error('Stack trace:', entry.stackTrace);
        }
        break;
    }
  }

  /**
   * Buffer log for remote sending
   */
  private bufferLog(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, send to logging service
      // Example: await fetch(this.config.remoteEndpoint, { method: 'POST', body: JSON.stringify(logsToSend) });
      
      // For now, just log that we would send
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Logger] Would send ${logsToSend.length} logs to remote endpoint`);
      }
    } catch (error) {
      console.error('[Logger] Failed to send logs to remote endpoint:', error);
      // Re-add logs to buffer
      this.logBuffer.unshift(...logsToSend);
    }
  }

  /**
   * Send alert for critical errors
   */
  private sendAlert(message: string, error?: Error, context?: Record<string, any>): void {
    // In production, integrate with alerting service (PagerDuty, Slack, etc.)
    console.error('[CRITICAL ALERT]', message, error, context);
    
    // TODO: Implement actual alerting
    // Example: Send to Slack webhook, PagerDuty, email, etc.
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context);
export const logCritical = (message: string, error?: Error, context?: Record<string, any>) => logger.critical(message, error, context);
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
