/**
 * Authentication and authorization logging utility
 * Tracks unauthorized access attempts for security monitoring
 */

interface AuthLogEntry {
  timestamp: Date;
  userId: string | null;
  endpoint: string;
  action: string;
  success: boolean;
  reason?: string;
}

class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private readonly maxLogs = 1000;

  /**
   * Log an authentication attempt
   */
  logAuth(
    userId: string | null,
    endpoint: string,
    action: string,
    success: boolean,
    reason?: string
  ): void {
    const entry: AuthLogEntry = {
      timestamp: new Date(),
      userId,
      endpoint,
      action,
      success,
      reason,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const status = success ? '✓' : '✗';
      console.log(
        `[AUTH ${status}] ${endpoint} - ${action} - User: ${userId || 'anonymous'}${
          reason ? ` - ${reason}` : ''
        }`
      );
    }

    // In production, you would send this to a logging service
    if (!success && process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY] Unauthorized access attempt:', entry);
    }
  }

  /**
   * Log successful authorization
   */
  logSuccess(userId: string, endpoint: string, action: string): void {
    this.logAuth(userId, endpoint, action, true);
  }

  /**
   * Log failed authorization
   */
  logFailure(
    userId: string | null,
    endpoint: string,
    action: string,
    reason: string
  ): void {
    this.logAuth(userId, endpoint, action, false, reason);
  }

  /**
   * Get recent unauthorized access attempts
   */
  getUnauthorizedAttempts(limit: number = 50): AuthLogEntry[] {
    return this.logs
      .filter((log) => !log.success)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get logs for a specific user
   */
  getUserLogs(userId: string, limit: number = 50): AuthLogEntry[] {
    return this.logs
      .filter((log) => log.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThanHours: number = 24): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    this.logs = this.logs.filter((log) => log.timestamp > cutoff);
  }
}

export const authLogger = new AuthLogger();

// Clean up old logs every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    authLogger.clearOldLogs(24);
  }, 3600000);
}
