import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/itinerary/generate
 * Generate AI-powered travel itinerary using Gemini
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured. Please add GEMINI_API_KEY to environment variables." },
        { status: 500 }
      );
    }
    
    if (apiKey === "your_gemini_api_key_here") {
      console.error("GEMINI_API_KEY is placeholder value");
      return NextResponse.json(
        { error: "Please replace GEMINI_API_KEY with your actual API key from Google AI Studio." },
        { status: 500 }
      );
    }
    
    console.log("[Itinerary] API key configured, length:", apiKey.length);

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
      // Continue without preferences - not critical
    }

    // Calculate trip duration
    const startDate = new Date(date_from);
    const endDate = new Date(date_to);
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Build dietary restrictions string
    let dietaryInfo = "";
    if (foodPrefs) {
      if (foodPrefs.dietaryRestrictions && foodPrefs.dietaryRestrictions.length > 0) {
        dietaryInfo += `\n- Dietary Restrictions: ${foodPrefs.dietaryRestrictions.join(', ')}`;
      }
      if (foodPrefs.allergies) {
        dietaryInfo += `\n- Allergies: ${foodPrefs.allergies}`;
      }
      if (foodPrefs.cuisinePreferences && foodPrefs.cuisinePreferences.length > 0) {
        dietaryInfo += `\n- Cuisine Preferences: ${foodPrefs.cuisinePreferences.join(', ')}`;
      }
      if (foodPrefs.avgMealBudget) {
        dietaryInfo += `\n- Meal Budget: ${foodPrefs.avgMealBudget}`;
      }
    }

    // Build lifestyle info
    let lifestyleInfo = "";
    if (lifestylePrefs) {
      if (lifestylePrefs.activityLevel) {
        lifestyleInfo += `\n- Activity Level: ${lifestylePrefs.activityLevel}`;
      }
      if (lifestylePrefs.accommodationPreference) {
        lifestyleInfo += `\n- Accommodation Preference: ${lifestylePrefs.accommodationPreference}`;
      }
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // System prompt with specific instructions
    const systemPrompt = `You are an AI travel planner that creates realistic and time-specific itineraries.

INSTRUCTIONS:
- Create a structured day-by-day plan with specific times
- Include morning (8-12), afternoon (12-17), and evening (17-22) activities
- Suggest specific restaurants and food experiences that match dietary preferences
- Keep descriptions concise and practical
- Only provide the itinerary, do not add extra explanations or introductions
- Format in clean markdown with day headers (## Day 1, ## Day 2, etc.)
- Use bullet points with time stamps (e.g., "• 9:00 AM - Visit Eiffel Tower")
- Consider travel time between locations
- Respect dietary restrictions and food preferences when recommending restaurants
- Match activity intensity to the user's activity level preference`;

    // Create detailed prompt
    const userPrompt = `Create a ${durationDays}-day travel itinerary for ${location}.

TRIP DETAILS:
- Destination: ${location}
- Dates: ${new Date(date_from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${new Date(date_to).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
- Duration: ${durationDays} days
- Group Size: ${group_size?.min || 1}-${group_size?.max || 4} travelers
${interests && interests.length > 0 ? `- Interests: ${interests.join(', ')}` : ''}${dietaryInfo}${lifestyleInfo}

REQUIREMENTS:
1. Provide specific times for each activity
2. Recommend restaurants that accommodate dietary restrictions
3. Include realistic travel times between locations
4. Match activity intensity to preferences
5. Suggest local food experiences aligned with cuisine preferences
6. Keep each day balanced and not overly packed

Start with Day 1 and provide the complete itinerary.`;

    // Generate itinerary with system prompt
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    console.log("[Itinerary] Sending request to Gemini...");
    const result = await model.generateContent(fullPrompt);
    
    console.log("[Itinerary] Received response from Gemini");
    console.log("[Itinerary] Result:", JSON.stringify(result, null, 2));
    
    const response = result.response;
    
    if (!response) {
      console.error("[Itinerary] No response from Gemini");
      return NextResponse.json(
        { error: "No response from AI service" },
        { status: 500 }
      );
    }
    
    const itinerary = response.text();
    console.log("[Itinerary] Generated itinerary length:", itinerary?.length || 0);

    if (!itinerary || itinerary.trim().length === 0) {
      console.error("[Itinerary] Empty itinerary generated");
      return NextResponse.json(
        { error: "AI generated empty itinerary. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        itinerary,
        metadata: {
          location,
          duration: durationDays,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/itinerary/generate] Error:", error);
    console.error("[POST /api/itinerary/generate] Error message:", error.message);
    console.error("[POST /api/itinerary/generate] Error stack:", error.stack);

    // Handle specific Gemini API errors
    if (error.message?.includes("API key") || error.message?.includes("API_KEY")) {
      return NextResponse.json(
        { error: "Invalid API key configuration. Please check GEMINI_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return NextResponse.json(
        { error: "AI service quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error.message?.includes("SAFETY")) {
      return NextResponse.json(
        { error: "Content filtered by AI safety settings. Please try with different trip details." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate itinerary. Server error: 500. Please try again later.",
        details: error.message || "Unknown error",
        type: error.name || "Error",
      },
      { status: 500 }
    );
  }
}
