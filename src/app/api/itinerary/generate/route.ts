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
    const backendUrl = process.env.PYTHON_BACKEND_URL || "https://tripsync-ai-backend.onrender.com";
    
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

    // Convert itinerary object to markdown string
    let itineraryMarkdown = "";
    
    if (typeof data.itinerary === "string") {
      // Already a string, use as-is
      itineraryMarkdown = data.itinerary;
    } else if (typeof data.itinerary === "object") {
      // Convert object to markdown format
      itineraryMarkdown = `# ${data.destination || location} - ${durationDays} Day Itinerary\n\n`;
      
      // Add each day
      const days = Object.keys(data.itinerary).sort();
      for (const day of days) {
        const dayData = data.itinerary[day];
        itineraryMarkdown += `## ${day}\n\n`;
        
        // Add morning activities
        if (dayData.morning && Array.isArray(dayData.morning)) {
          itineraryMarkdown += `### Morning\n\n`;
          for (const activity of dayData.morning) {
            itineraryMarkdown += `**${activity.time || ""}** - **${activity.activity || "Activity"}**\n`;
            itineraryMarkdown += `${activity.description || ""}\n`;
            if (activity.cost) {
              itineraryMarkdown += `*Cost: $${activity.cost}*\n`;
            }
            itineraryMarkdown += `\n`;
          }
        }
        
        // Add afternoon activities
        if (dayData.afternoon && Array.isArray(dayData.afternoon)) {
          itineraryMarkdown += `### Afternoon\n\n`;
          for (const activity of dayData.afternoon) {
            itineraryMarkdown += `**${activity.time || ""}** - **${activity.activity || "Activity"}**\n`;
            itineraryMarkdown += `${activity.description || ""}\n`;
            if (activity.cost) {
              itineraryMarkdown += `*Cost: $${activity.cost}*\n`;
            }
            itineraryMarkdown += `\n`;
          }
        }
        
        // Add evening activities
        if (dayData.evening && Array.isArray(dayData.evening)) {
          itineraryMarkdown += `### Evening\n\n`;
          for (const activity of dayData.evening) {
            itineraryMarkdown += `**${activity.time || ""}** - **${activity.activity || "Activity"}**\n`;
            itineraryMarkdown += `${activity.description || ""}\n`;
            if (activity.cost) {
              itineraryMarkdown += `*Cost: $${activity.cost}*\n`;
            }
            itineraryMarkdown += `\n`;
          }
        }
        
        itineraryMarkdown += `---\n\n`;
      }
      
      // Add budget breakdown if available
      if (data.budgetBreakdown) {
        itineraryMarkdown += `## Budget Breakdown\n\n`;
        itineraryMarkdown += `**Total Cost:** $${data.budgetBreakdown.totalCost || 0}\n\n`;
        
        if (data.budgetBreakdown.dailyCosts && Array.isArray(data.budgetBreakdown.dailyCosts)) {
          itineraryMarkdown += `### Daily Costs\n\n`;
          for (const dayCost of data.budgetBreakdown.dailyCosts) {
            itineraryMarkdown += `- Day ${dayCost.day}: $${dayCost.total}\n`;
          }
        }
      }
    } else {
      // Fallback
      itineraryMarkdown = "Unable to format itinerary. Please try again.";
    }

    return NextResponse.json(
      {
        itinerary: itineraryMarkdown,
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
