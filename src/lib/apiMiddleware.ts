/**
 * Comprehensive API Middleware for Azure AI Integration
 * Provides rate limiting, timeout handling, request logging, and error tracking
 * Requirements: 3.5, 3.6, 3.7, 5.2, 5.3, 5.4
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ErrorHandlingService, ServiceError } from "@/services/ErrorHandlingService";
import { rateLimiter, strictRateLimiter, addRateLimitHeaders } from "@/lib/rateLimit";

// Request timeout configuration
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const AI_ENDPOINT_TIMEOUT_MS = 60000; // 60 seconds for AI operations

// Request logging interface
interface RequestLog {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  processingTime?: number;
  statusCode?: number;
  error?: string;
}

// Middleware configuration
interface MiddlewareConfig {
  requireAuth?: boolean;
  useStrictRateLimit?: boolean;
  timeoutMs?: number;
  logRequests?: boolean;
}

/**
 * Comprehensive API middleware wrapper
 */
export function withApiMiddleware(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: MiddlewareConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    // Initialize request log
    const requestLog: RequestLog = {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIP(request),
      timestamp: new Date().toISOString()
    };

    try {
      // Authentication check
      let userId: string | undefined;
      if (config.requireAuth !== false) {
        const authResult = await auth();
        userId = authResult.userId || undefined;
        
        if (!userId) {
          const errorResponse = ErrorHandlingService.createErrorResponse(
            new ServiceError("Authentication required", "authentication" as any, 401),
            requestId
          );
          
          logRequest({ ...requestLog, statusCode: 401, error: "Unauthorized" });
          return NextResponse.json(errorResponse, { status: 401 });
        }
        
        requestLog.userId = userId;
      }

      // Rate limiting
      if (userId) {
        const limiter = config.useStrictRateLimit ? strictRateLimiter : rateLimiter;
        const rateLimitResult = limiter.check(userId);
        
        if (!rateLimitResult.allowed) {
          const errorResponse = ErrorHandlingService.createErrorResponse(
            new ServiceError("Rate limit exceeded", "rate_limit" as any, 429),
            requestId
          );
          
          const response = NextResponse.json(errorResponse, { status: 429 });
          addRateLimitHeaders(response.headers, 0, rateLimitResult.resetTime);
          response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
          
          logRequest({ ...requestLog, statusCode: 429, error: "Rate limit exceeded" });
          return response;
        }
        
        // Add rate limit headers to successful responses
        const headers = new Headers();
        addRateLimitHeaders(headers, rateLimitResult.remaining, rateLimitResult.resetTime);
      }

      // Timeout handling
      const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceError(
            `Request timeout after ${timeoutMs}ms`,
            "timeout" as any,
            504
          ));
        }, timeoutMs);
      });

      // Execute handler with timeout
      const handlerPromise = handler(request, { ...context, requestId, userId });
      const response = await Promise.race([handlerPromise, timeoutPromise]);

      // Log successful request
      const processingTime = Date.now() - startTime;
      logRequest({
        ...requestLog,
        processingTime,
        statusCode: response.status
      });

      // Add common headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      // Add rate limit headers if user is authenticated
      if (userId) {
        const limiter = config.useStrictRateLimit ? strictRateLimiter : rateLimiter;
        const rateLimitResult = limiter.check(userId);
        addRateLimitHeaders(response.headers, rateLimitResult.remaining, rateLimitResult.resetTime);
      }

      return response;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      // Log error with context
      ErrorHandlingService.logError(
        error,
        {
          operation: 'apiMiddleware',
          path: request.nextUrl.pathname,
          method: request.method,
          userId: requestLog.userId,
          processingTime
        },
        requestId
      );

      // Log failed request
      logRequest({
        ...requestLog,
        processingTime,
        statusCode: error.statusCode || 500,
        error: error.message
      });

      // Handle service errors
      if (error instanceof ServiceError) {
        const errorResponse = ErrorHandlingService.createErrorResponse(error, requestId);
        const response = NextResponse.json(errorResponse, { status: error.statusCode });
        
        // Add common headers
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-Processing-Time', processingTime.toString());
        
        return response;
      }

      // Handle unexpected errors
      const errorResponse = ErrorHandlingService.createErrorResponse(
        new ServiceError(
          "An unexpected error occurred",
          "unknown" as any,
          500
        ),
        requestId
      );

      const response = NextResponse.json(errorResponse, { status: 500 });
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Processing-Time', processingTime.toString());
      
      return response;
    }
  };
}

/**
 * Specialized middleware for AI endpoints
 */
export function withAIMiddleware(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withApiMiddleware(handler, {
    requireAuth: true,
    useStrictRateLimit: true,
    timeoutMs: AI_ENDPOINT_TIMEOUT_MS,
    logRequests: true
  });
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string | undefined {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return undefined;
}

/**
 * Log request details for monitoring and debugging
 */
function logRequest(log: RequestLog): void {
  // Determine log level based on status code
  if (log.statusCode && log.statusCode >= 500) {
    console.error('[API Request]', log);
  } else if (log.statusCode && log.statusCode >= 400) {
    console.warn('[API Request]', log);
  } else {
    console.log('[API Request]', log);
  }
  
  // In production, you might want to send this to a logging service
  // like CloudWatch, DataDog, or similar
}

/**
 * Validate request content type
 */
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): void {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expectedType)) {
    throw new ServiceError(
      `Invalid content type. Expected ${expectedType}`,
      "validation" as any,
      400
    );
  }
}

/**
 * Validate request size
 */
export function validateRequestSize(request: NextRequest, maxSizeBytes: number = 1024 * 1024): void {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new ServiceError(
      `Request too large. Maximum size is ${maxSizeBytes} bytes`,
      "validation" as any,
      413
    );
  }
}

/**
 * CORS headers for API responses
 */
export function addCORSHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleCORSPreflight(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCORSHeaders(response);
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Request metrics for monitoring
 */
interface RequestMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
}

class MetricsCollector {
  private metrics: {
    requests: number;
    totalResponseTime: number;
    errors: number;
    rateLimitHits: number;
  } = {
    requests: 0,
    totalResponseTime: 0,
    errors: 0,
    rateLimitHits: 0
  };

  recordRequest(processingTime: number, statusCode: number): void {
    this.metrics.requests++;
    this.metrics.totalResponseTime += processingTime;
    
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
    
    if (statusCode === 429) {
      this.metrics.rateLimitHits++;
    }
  }

  getMetrics(): RequestMetrics {
    return {
      totalRequests: this.metrics.requests,
      averageResponseTime: this.metrics.requests > 0 
        ? this.metrics.totalResponseTime / this.metrics.requests 
        : 0,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests) * 100 
        : 0,
      rateLimitHits: this.metrics.rateLimitHits
    };
  }

  reset(): void {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      errors: 0,
      rateLimitHits: 0
    };
  }
}

// Global metrics collector
export const metricsCollector = new MetricsCollector();