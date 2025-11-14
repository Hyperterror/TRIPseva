import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/itinerary/generate
 * Generate AI-powered travel itinerary using Python backend (Groq)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Python backend URL from environment
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    
    console.log("[Itinerary] Using Python backend:", backendUrl);

    // Parse request body
    const body = await request.json();
    const { location, date_from, date_to, interests, group_size } = body;

    // Validate required fields
    if (!location || !date_from || !date_to) {
      return NextResponse.json(
        { error: "Missing required fields: location, date_from, date_to" },
        { status: 400 }
      );
    }

    // Fetch user preferences for personalization
    let foodPrefs = null;
    let lifestylePrefs = null;
    
    try {
      const { FoodPreferences } = await import("@/models/FoodPreferences");
      const { UserPreferences } = await import("@/models/UserPreferences");
      const { connect } = await import("@/db/dbconfig");
      
      await connect();
      
      foodPrefs = await FoodPreferences.findOne({ userId }).lean();
      lifestylePrefs = await UserPreferences.findOne({ userId }).lean();
    } catch (prefError) {
      console.log("[Preferences fetch] Could not fetch preferences, continuing without them:", prefError);
    }

    // Build request payload for Python backend
    const backendPayload = {
      location,
      date_from,
      date_to,
      interests: interests || [],
      group_size: group_size || { min: 1, max: 4 },
      dietary_restrictions: foodPrefs?.dietaryRestrictions || [],
      allergies: foodPrefs?.allergies || null,
      cuisine_preferences: foodPrefs?.cuisinePreferences || [],
      meal_budget: foodPrefs?.avgMealBudget || null,
      activity_level: lifestylePrefs?.activityLevel || null,
      accommodation_preference: lifestylePrefs?.accommodationPreference || null,
    };

    console.log("[Itinerary] Sending request to Python backend...");
    
    // Call Python backend
    const response = await fetch(`${backendUrl}/api/generate-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
      console.error("[Itinerary] Backend error:", errorData);
      
      return NextResponse.json(
        { 
          error: "Failed to generate itinerary from backend",
          details: errorData.detail || "Backend service error"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Itinerary] Received response from Python backend");

    if (!data.success || !data.itinerary) {
      console.error("[Itinerary] Invalid response from backend:", data);
      return NextResponse.json(
        { error: "Invalid response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        itinerary: data.itinerary,
        metadata: data.metadata,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[POST /api/itinerary/generate] Error:", error);
    console.error("[POST /api/itinerary/generate] Error message:", error.message);

    // Handle network errors
    if (error.code === "ECONNREFUSED" || error.message?.includes("fetch failed")) {
      return NextResponse.json(
        { 
          error: "Cannot connect to AI backend service. Please ensure the Python backend is running.",
          details: "Backend connection failed"
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
