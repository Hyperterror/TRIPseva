import { NextRequest, NextResponse } from "next/server";
import { withAIMiddleware, validateContentType } from "@/lib/apiMiddleware";

/**
 * POST /api/ai/find-matches
 * Find compatible travel companions using Firebase via Python Backend
 */
async function handlePOST(request: NextRequest, context: { requestId: string; userId: string }) {
  const { requestId, userId } = context;

  try {
    validateContentType(request);

    // Parse request body
    const body = await request.json();

    // Prepare payload for Python backend
    const payload = {
      user_id: userId,
      destination: body.destination,
      start_date: body.start_date,
      end_date: body.end_date,
      interests: body.interests || [],
      min_compatibility: body.min_compatibility
    };

    console.log(`[AI Matching] Forwarding request to Python Backend: ${process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'}`);

    // Call Python Backend
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/google/find-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Matching] Python backend error: ${response.status} - ${errorText}`);
      return NextResponse.json({ success: false, error: "Failed to find matches service" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[AI Matching] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error during matching"
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/find-matches
 * Get status check - redirected to backend health
 */
async function handleGET(request: NextRequest, context: { requestId: string; userId: string }) {
  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    return NextResponse.json({
      success: true,
      service: "Google Cloud (Python Backend)",
      status: data.status
    });
  } catch (e) {
    return NextResponse.json({ success: false, status: "Backend unavailable" }, { status: 503 });
  }
}

export const POST = withAIMiddleware(handlePOST);
export const GET = withAIMiddleware(handleGET);