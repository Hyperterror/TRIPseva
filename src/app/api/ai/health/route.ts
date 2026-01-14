import { NextRequest, NextResponse } from "next/server";
import { azureOpenAIService } from "@/services/AzureOpenAIService";
import { azureSearchService } from "@/services/AzureSearchService";
import { withApiMiddleware } from "@/lib/apiMiddleware";
import { metricsCollector } from "@/lib/apiMiddleware";

/**
 * GET /api/ai/health
 * Health check endpoint for Azure AI services
 * Requirements: 3.7, 5.7, 6.6
 */
async function handleGET(request: NextRequest, context: { requestId: string }) {
  const { requestId } = context;

  try {
    // Get health status from both services
    const [openAIHealth, searchHealth] = await Promise.allSettled([
      azureOpenAIService.getHealthStatus(),
      azureSearchService.getHealthStatus()
    ]);

    // Get API metrics
    const metrics = metricsCollector.getMetrics();

    // Determine overall health
    const openAIHealthy = openAIHealth.status === 'fulfilled' && openAIHealth.value.healthy;
    const searchHealthy = searchHealth.status === 'fulfilled' && searchHealth.value.healthy;
    const overallHealthy = openAIHealthy && searchHealthy;

    const healthStatus = {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      requestId,
      services: {
        azureOpenAI: {
          status: openAIHealthy ? 'healthy' : 'unhealthy',
          details: openAIHealth.status === 'fulfilled' 
            ? openAIHealth.value 
            : { error: openAIHealth.reason?.message || 'Service check failed' }
        },
        azureSearch: {
          status: searchHealthy ? 'healthy' : 'unhealthy',
          details: searchHealth.status === 'fulfilled' 
            ? searchHealth.value 
            : { error: searchHealth.reason?.message || 'Service check failed' }
        }
      },
      metrics: {
        api: metrics,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    const statusCode = overallHealthy ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error: any) {
    console.error('[Health Check] Unexpected error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        requestId,
        error: 'Health check failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Export the wrapped handler (no auth required for health checks)
export const GET = withApiMiddleware(handleGET, { 
  requireAuth: false, 
  useStrictRateLimit: false,
  timeoutMs: 10000 // 10 second timeout for health checks
});