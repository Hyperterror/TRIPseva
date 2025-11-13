/**
 * Metrics Tracking Utility
 * Track performance metrics, API usage, and business metrics
 * In production, integrate with services like Datadog, New Relic, or CloudWatch
 */

interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface ApiCallMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  userId?: string;
  timestamp: Date;
}

interface CacheMetric {
  key: string;
  hit: boolean;
  timestamp: Date;
}

interface ExternalApiMetric {
  service: string;
  endpoint: string;
  duration: number;
  success: boolean;
  cost?: number;
  timestamp: Date;
}

class MetricsService {
  private metrics: MetricData[] = [];
  private apiCalls: ApiCallMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private externalApiCalls: ExternalApiMetric[] = [];
  
  private readonly MAX_METRICS_BUFFER = 1000;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    // Start periodic flush in production
    if (process.env.NODE_ENV === 'production') {
      this.startPeriodicFlush();
    }
  }

  /**
   * Track a custom metric
   */
  track(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);
    this.checkAndFlush();

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Metrics] ${name}: ${value} ${unit}`, tags);
    }
  }

  /**
   * Track API call metrics
   */
  trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    userId?: string
  ): void {
    const metric: ApiCallMetric = {
      endpoint,
      method,
      duration,
      statusCode,
      success: statusCode >= 200 && statusCode < 400,
      userId,
      timestamp: new Date()
    };

    this.apiCalls.push(metric);
    
    // Track as generic metric
    this.track('api.call', 1, 'count', {
      endpoint,
      method,
      status: statusCode.toString()
    });
    
    this.track('api.duration', duration, 'ms', {
      endpoint,
      method
    });

    this.checkAndFlush();
  }

  /**
   * Track cache hit/miss
   */
  trackCacheAccess(key: string, hit: boolean): void {
    const metric: CacheMetric = {
      key,
      hit,
      timestamp: new Date()
    };

    this.cacheMetrics.push(metric);
    
    this.track('cache.access', 1, 'count', {
      result: hit ? 'hit' : 'miss'
    });

    this.checkAndFlush();
  }

  /**
   * Track external API call (e.g., Google Places)
   */
  trackExternalApiCall(
    service: string,
    endpoint: string,
    duration: number,
    success: boolean,
    cost?: number
  ): void {
    const metric: ExternalApiMetric = {
      service,
      endpoint,
      duration,
      success,
      cost,
      timestamp: new Date()
    };

    this.externalApiCalls.push(metric);
    
    this.track('external_api.call', 1, 'count', {
      service,
      success: success.toString()
    });
    
    this.track('external_api.duration', duration, 'ms', {
      service
    });

    if (cost !== undefined) {
      this.track('external_api.cost', cost, 'usd', {
        service
      });
    }

    this.checkAndFlush();
  }

  /**
   * Track Google Places API usage
   */
  trackGooglePlacesApiCall(
    requestType: string,
    duration: number,
    success: boolean,
    resultCount?: number
  ): void {
    // Google Places API costs vary by request type
    // Nearby Search: $0.032 per request
    const cost = 0.032;

    this.trackExternalApiCall(
      'google_places',
      requestType,
      duration,
      success,
      cost
    );

    if (resultCount !== undefined) {
      this.track('google_places.results', resultCount, 'count', {
        requestType
      });
    }
  }

  /**
   * Track database query
   */
  trackDbQuery(
    collection: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    this.track('db.query', 1, 'count', {
      collection,
      operation,
      success: success.toString()
    });
    
    this.track('db.duration', duration, 'ms', {
      collection,
      operation
    });
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    userId: string,
    metadata?: Record<string, string>
  ): void {
    this.track('user.action', 1, 'count', {
      action,
      userId,
      ...metadata
    });
  }

  /**
   * Track business metric
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    metadata?: Record<string, string>
  ): void {
    this.track(`business.${metric}`, value, 'count', metadata);
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(timeWindowMs: number = 3600000): number {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.cacheMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    );

    if (recentMetrics.length === 0) {
      return 0;
    }

    const hits = recentMetrics.filter(m => m.hit).length;
    return (hits / recentMetrics.length) * 100;
  }

  /**
   * Get average API response time
   */
  getAverageApiResponseTime(endpoint?: string, timeWindowMs: number = 3600000): number {
    const cutoff = Date.now() - timeWindowMs;
    let relevantCalls = this.apiCalls.filter(
      m => m.timestamp.getTime() > cutoff
    );

    if (endpoint) {
      relevantCalls = relevantCalls.filter(m => m.endpoint === endpoint);
    }

    if (relevantCalls.length === 0) {
      return 0;
    }

    const totalDuration = relevantCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalDuration / relevantCalls.length;
  }

  /**
   * Get API success rate
   */
  getApiSuccessRate(endpoint?: string, timeWindowMs: number = 3600000): number {
    const cutoff = Date.now() - timeWindowMs;
    let relevantCalls = this.apiCalls.filter(
      m => m.timestamp.getTime() > cutoff
    );

    if (endpoint) {
      relevantCalls = relevantCalls.filter(m => m.endpoint === endpoint);
    }

    if (relevantCalls.length === 0) {
      return 0;
    }

    const successfulCalls = relevantCalls.filter(m => m.success).length;
    return (successfulCalls / relevantCalls.length) * 100;
  }

  /**
   * Get total external API cost
   */
  getTotalExternalApiCost(service?: string, timeWindowMs: number = 86400000): number {
    const cutoff = Date.now() - timeWindowMs;
    let relevantCalls = this.externalApiCalls.filter(
      m => m.timestamp.getTime() > cutoff && m.cost !== undefined
    );

    if (service) {
      relevantCalls = relevantCalls.filter(m => m.service === service);
    }

    return relevantCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
  }

  /**
   * Get metrics summary
   */
  getSummary(timeWindowMs: number = 3600000): {
    cacheHitRate: number;
    avgApiResponseTime: number;
    apiSuccessRate: number;
    totalApiCalls: number;
    totalExternalApiCost: number;
  } {
    const cutoff = Date.now() - timeWindowMs;

    return {
      cacheHitRate: this.getCacheHitRate(timeWindowMs),
      avgApiResponseTime: this.getAverageApiResponseTime(undefined, timeWindowMs),
      apiSuccessRate: this.getApiSuccessRate(undefined, timeWindowMs),
      totalApiCalls: this.apiCalls.filter(m => m.timestamp.getTime() > cutoff).length,
      totalExternalApiCost: this.getTotalExternalApiCost(undefined, timeWindowMs)
    };
  }

  /**
   * Check if we should flush metrics
   */
  private checkAndFlush(): void {
    if (this.metrics.length >= this.MAX_METRICS_BUFFER) {
      this.flush();
    }
  }

  /**
   * Flush metrics to monitoring service
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0) {
      return;
    }

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // In production, send to monitoring service
      // Example: Datadog, New Relic, CloudWatch, etc.
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Metrics] Would send ${metricsToSend.length} metrics to monitoring service`);
      }

      // TODO: Implement actual metric sending
      // Example for Datadog:
      // await fetch('https://api.datadoghq.com/api/v1/series', {
      //   method: 'POST',
      //   headers: { 'DD-API-KEY': process.env.DATADOG_API_KEY },
      //   body: JSON.stringify({ series: metricsToSend })
      // });

    } catch (error) {
      console.error('[Metrics] Failed to send metrics:', error);
      // Re-add metrics to buffer
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop periodic flush
   */
  stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
    this.apiCalls = [];
    this.cacheMetrics = [];
    this.externalApiCalls = [];
  }
}

// Singleton instance
export const metricsService = new MetricsService();

// Convenience exports
export const trackMetric = (name: string, value: number, unit?: string, tags?: Record<string, string>) => 
  metricsService.track(name, value, unit, tags);

export const trackApiCall = (endpoint: string, method: string, duration: number, statusCode: number, userId?: string) =>
  metricsService.trackApiCall(endpoint, method, duration, statusCode, userId);

export const trackCacheAccess = (key: string, hit: boolean) =>
  metricsService.trackCacheAccess(key, hit);

export const trackGooglePlacesApi = (requestType: string, duration: number, success: boolean, resultCount?: number) =>
  metricsService.trackGooglePlacesApiCall(requestType, duration, success, resultCount);
