import { NextRequest, NextResponse } from "next/server";
import { withAIMiddleware, validateContentType } from "@/lib/apiMiddleware";

/**
 * POST /api/ai/generate-itinerary
 * Generate AI-powered travel itinerary using Google Gemini via Python Backend
 */
async function handlePOST(request: NextRequest, context: { requestId: string; userId: string }) {
  const { requestId, userId } = context;

  try {
    validateContentType(request);

    // Parse request body
    const body = await request.json();

    // Prepare payload for Python backend
    const payload = {
      destination: body.destination,
      start_date: body.start_date,
      end_date: body.end_date,
      interests: body.interests || [],
      budget_per_day: body.budget_per_day || 100,
      dietary_restrictions: body.dietary_restrictions || [],
      travel_pace: body.travel_pace || 'moderate',
      group_size: body.group_size || 1,
      accessibility_needs: body.accessibility_needs || []
    };

    console.log(`[AI Itinerary] Forwarding request to Python Backend: ${process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'}`);

    // Call Python Backend
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/google/generate-itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Itinerary] Python backend error: ${response.status} - ${errorText}`);
      return NextResponse.json({ success: false, error: "Failed to generate itinerary via AI service" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[AI Itinerary] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error during itinerary generation"
    }, { status: 500 });
  }
}

export const POST = withAIMiddleware(handlePOST);