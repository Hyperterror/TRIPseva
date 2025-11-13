/**
 * CacheService - In-memory caching service for API responses
 * Note: For production, replace with Redis for distributed caching
 */

interface CacheItem {
  data: any;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheItem>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Get cached data by key
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set data in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete cached data by key
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Start periodic cleanup of expired entries
   * @param intervalMs - Cleanup interval in milliseconds (default: 1 hour)
   */
  startCleanupInterval(intervalMs: number = 3600000): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removedCount = 0;

      for (const [key, value] of this.cache.entries()) {
        if (now > value.expiry) {
          this.cache.delete(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`[CacheService] Cleaned up ${removedCount} expired entries`);
      }
    }, intervalMs);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Generate cache key from parameters
   * @param prefix - Key prefix
   * @param params - Parameters to include in key
   * @returns Generated cache key
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Start cleanup interval on module load
cacheService.startCleanupInterval();
