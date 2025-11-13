/**
 * Rate limiting utility for API endpoints
 * Prevents abuse and protects against DDoS attacks
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (usually userId)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, {
        count: 1,
        resetTime,
      });

      return {
        allowed: true,
        remaining: this.limit - 1,
        resetTime,
      };
    }

    // Within rate limit
    if (entry.count < this.limit) {
      entry.count++;
      this.requests.set(identifier, entry);

      return {
        allowed: true,
        remaining: this.limit - entry.count,
        resetTime: entry.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { totalUsers: number; totalRequests: number } {
    let totalRequests = 0;
    for (const entry of this.requests.values()) {
      totalRequests += entry.count;
    }

    return {
      totalUsers: this.requests.size,
      totalRequests,
    };
  }
}

// Global rate limiter instance (100 requests per minute per user)
export const rateLimiter = new RateLimiter(100, 60000);

// Stricter rate limiter for sensitive operations (20 requests per minute)
export const strictRateLimiter = new RateLimiter(20, 60000);

/**
 * Helper function to add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  remaining: number,
  resetTime: number
): void {
  headers.set('X-RateLimit-Limit', '100');
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
}
