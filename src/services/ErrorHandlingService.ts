/**
 * Centralized Error Handling Service for Azure AI Integration
 * Provides error categorization, retry strategies, and circuit breaker patterns
 */

// Error Categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication', 
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration',
  PROCESSING = 'processing',
  UNKNOWN = 'unknown'
}

// HTTP Status Code Mappings
export const HTTP_STATUS_CODES = {
  // Success
  OK: 200,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  INSUFFICIENT_STORAGE: 507
} as const;

// Retry Strategy Configuration
export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCategory[];
}

// Circuit Breaker Configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

// Standardized Error Response
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    statusCode: number;
    retryable: boolean;
    timestamp: string;
    requestId?: string;
  };
  retryAfter?: number;
}

// Service Error Class
export class ServiceError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public statusCode: number = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ErrorHandlingService {
  private static readonly DEFAULT_RETRY_STRATEGY: RetryStrategy = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.SERVICE_UNAVAILABLE,
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT
    ]
  };

  private static readonly DEFAULT_CIRCUIT_BREAKER: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000
  };

  /**
   * Categorize error based on error details
   */
  static categorizeError(error: any): ErrorCategory {
    // Check HTTP status codes
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      
      if (status === 400) return ErrorCategory.VALIDATION;
      if (status === 401 || status === 403) return ErrorCategory.AUTHENTICATION;
      if (status === 429) return ErrorCategory.RATE_LIMIT;
      if (status === 503) return ErrorCategory.SERVICE_UNAVAILABLE;
      if (status === 504) return ErrorCategory.TIMEOUT;
    }

    // Check error codes
    if (error.code) {
      switch (error.code) {
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
        case 'ECONNRESET':
          return ErrorCategory.NETWORK;
        case 'ETIMEDOUT':
          return ErrorCategory.TIMEOUT;
        default:
          break;
      }
    }

    // Check error messages
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('timeout')) return ErrorCategory.TIMEOUT;
    if (message.includes('network') || message.includes('connection')) return ErrorCategory.NETWORK;
    if (message.includes('rate limit')) return ErrorCategory.RATE_LIMIT;
    if (message.includes('unauthorized') || message.includes('authentication')) return ErrorCategory.AUTHENTICATION;
    if (message.includes('validation') || message.includes('invalid')) return ErrorCategory.VALIDATION;
    if (message.includes('configuration') || message.includes('config')) return ErrorCategory.CONFIGURATION;

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Map error category to HTTP status code
   */
  static getStatusCodeForCategory(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return HTTP_STATUS_CODES.BAD_REQUEST;
      case ErrorCategory.AUTHENTICATION:
        return HTTP_STATUS_CODES.UNAUTHORIZED;
      case ErrorCategory.RATE_LIMIT:
        return HTTP_STATUS_CODES.TOO_MANY_REQUESTS;
      case ErrorCategory.SERVICE_UNAVAILABLE:
        return HTTP_STATUS_CODES.SERVICE_UNAVAILABLE;
      case ErrorCategory.NETWORK:
        return HTTP_STATUS_CODES.BAD_GATEWAY;
      case ErrorCategory.TIMEOUT:
        return HTTP_STATUS_CODES.GATEWAY_TIMEOUT;
      case ErrorCategory.CONFIGURATION:
        return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
      case ErrorCategory.PROCESSING:
        return HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;
      default:
        return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(category: ErrorCategory): boolean {
    return this.DEFAULT_RETRY_STRATEGY.retryableErrors.includes(category);
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    error: Error | ServiceError,
    requestId?: string
  ): ErrorResponse {
    let category: ErrorCategory;
    let statusCode: number;
    let retryable: boolean;

    if (error instanceof ServiceError) {
      category = error.category;
      statusCode = error.statusCode;
      retryable = error.retryable;
    } else {
      category = this.categorizeError(error);
      statusCode = this.getStatusCodeForCategory(category);
      retryable = this.isRetryable(category);
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: category.toUpperCase(),
        message: this.sanitizeErrorMessage(error.message),
        category,
        statusCode,
        retryable,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    // Add retry-after header for rate limiting
    if (category === ErrorCategory.RATE_LIMIT) {
      response.retryAfter = 60; // 60 seconds
    }

    return response;
  }

  /**
   * Execute operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    strategy: Partial<RetryStrategy> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_RETRY_STRATEGY, ...strategy };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );
          console.log(`[Retry] Attempt ${attempt} after ${delay}ms delay`);
          await this.sleep(delay);
        }

        return await operation();

      } catch (error) {
        lastError = error as Error;
        const category = this.categorizeError(error);
        
        // Don't retry non-retryable errors
        if (!config.retryableErrors.includes(category)) {
          throw error;
        }

        console.warn(`[Retry] Attempt ${attempt + 1} failed:`, error);
      }
    }

    throw new ServiceError(
      `Operation failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`,
      ErrorCategory.SERVICE_UNAVAILABLE,
      HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
      false,
      lastError || undefined
    );
  }

  /**
   * Implement graceful degradation
   */
  static async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    fallbackCondition: (error: Error) => boolean = () => true
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      const category = this.categorizeError(error);
      
      if (fallbackCondition(error as Error)) {
        console.warn(`[Fallback] Primary operation failed, using fallback:`, error);
        try {
          return await fallbackOperation();
        } catch (fallbackError) {
          console.error(`[Fallback] Fallback operation also failed:`, fallbackError);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  }

  /**
   * Sanitize error messages to prevent information leakage
   */
  private static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information patterns
    return message
      .replace(/key[=:]\s*[a-zA-Z0-9+/=]+/gi, 'key=***')
      .replace(/token[=:]\s*[a-zA-Z0-9+/=]+/gi, 'token=***')
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***');
  }

  /**
   * Log error with appropriate level and context
   */
  static logError(
    error: Error | ServiceError,
    context: Record<string, any> = {},
    requestId?: string
  ): void {
    const category = error instanceof ServiceError 
      ? error.category 
      : this.categorizeError(error);

    const logData = {
      error: {
        name: error.name,
        message: this.sanitizeErrorMessage(error.message),
        category,
        stack: error.stack
      },
      context,
      requestId,
      timestamp: new Date().toISOString()
    };

    // Log at appropriate level based on category
    switch (category) {
      case ErrorCategory.VALIDATION:
      case ErrorCategory.AUTHENTICATION:
        console.warn('[Error]', logData);
        break;
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.TIMEOUT:
        console.info('[Error]', logData);
        break;
      default:
        console.error('[Error]', logData);
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please check your credentials.';
      case ErrorCategory.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorCategory.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later.';
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection.';
      case ErrorCategory.TIMEOUT:
        return 'Request timed out. Please try again.';
      case ErrorCategory.CONFIGURATION:
        return 'Service configuration issue. Please contact support.';
      case ErrorCategory.PROCESSING:
        return 'Unable to process your request. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Utility function for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Circuit Breaker Implementation
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private config: CircuitBreakerConfig = ErrorHandlingService['DEFAULT_CIRCUIT_BREAKER']) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.checkState();

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private checkState(): void {
    const now = Date.now();

    if (this.state === 'open') {
      if (now - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'half-open';
        console.log('[Circuit Breaker] Moved to half-open state');
      } else {
        throw new ServiceError(
          'Service temporarily unavailable (circuit breaker open)',
          ErrorCategory.SERVICE_UNAVAILABLE,
          HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
          true
        );
      }
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      console.warn('[Circuit Breaker] Opened due to repeated failures');
    }
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}