import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, metricsCollector } from "@/lib/apiMiddleware";
import { rateLimiter, strictRateLimiter } from "@/lib/rateLimit";

/**
 * GET /api/ai/metrics
 * Get API metrics and performance statistics
 * Requirements: 3.7, 5.7, 6.6
 */
async function handleGET(request: NextRequest, context: { requestId: string; userId?: string }) {
  const { requestId, userId } = context;

  try {
    // Get API metrics
    const apiMetrics = metricsCollector.getMetrics();
    
    // Get rate limiter stats
    const rateLimiterStats = rateLimiter.getStats();
    const strictRateLimiterStats = strictRateLimiter.getStats();

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    const metrics = {
      timestamp: new Date().toISOString(),
      requestId,
      api: {
        ...apiMetrics,
        rateLimiting: {
          standard: rateLimiterStats,
          strict: strictRateLimiterStats
        }
      },
      system: systemMetrics,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAzureConfig: !!(process.env.AZURE_OPENAI_KEY && process.env.AZURE_SEARCH_KEY)
      }
    };

    return NextResponse.json(metrics, { status: 200 });

  } catch (error: any) {
    console.error('[Metrics] Error collecting metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
        requestId,
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/metrics
 * Reset API metrics (admin only)
 */
async function handleDELETE(request: NextRequest, context: { requestId: string; userId: string }) {
  const { requestId, userId } = context;

  try {
    // In a real application, you'd check if the user is an admin
    // For now, we'll allow any authenticated user to reset metrics
    
    metricsCollector.reset();

    return NextResponse.json(
      {
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString(),
        requestId,
        resetBy: userId
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Metrics] Error resetting metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to reset metrics',
        timestamp: new Date().toISOString(),
        requestId,
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Export the wrapped handlers
export const GET = withApiMiddleware(handleGET, { 
  requireAuth: false, // Allow public access to basic metrics
  useStrictRateLimit: false,
  timeoutMs: 5000
});

export const DELETE = withApiMiddleware(handleDELETE, { 
  requireAuth: true, // Require auth for reset
  useStrictRateLimit: true,
  timeoutMs: 5000
});