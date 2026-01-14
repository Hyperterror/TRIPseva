import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserPreferences } from "@/models/UserPreferences";
import { SearchIndexManager } from "@/services/SearchIndexManager";

/**
 * POST /api/preferences/lifestyle
 * Create or update user lifestyle preferences
 */
export async function POST(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      alcoholConsumption,
      smoking,
      activityLevel,
      sleepSchedule,
      budgetFlexibility,
      accommodationPreference
    } = body;

    // Validate enum values if provided
    const validAlcohol = ['teetotaler', 'occasional', 'regular', 'no_preference', null];
    const validSmoking = ['non_smoker', 'smoker', 'no_preference', null];
    const validActivity = ['relaxed', 'moderate', 'high_energy', null];
    const validSleep = ['early_riser', 'night_owl', 'flexible', null];
    const validBudget = ['strict', 'flexible', 'open_ended', null];
    const validAccommodation = ['budget', 'mid_range', 'luxury', null];

    if (alcoholConsumption !== undefined && !validAlcohol.includes(alcoholConsumption)) {
      return NextResponse.json(
        { error: "Invalid alcohol consumption value" },
        { status: 400 }
      );
    }

    if (smoking !== undefined && !validSmoking.includes(smoking)) {
      return NextResponse.json(
        { error: "Invalid smoking value" },
        { status: 400 }
      );
    }

    if (activityLevel !== undefined && !validActivity.includes(activityLevel)) {
      return NextResponse.json(
        { error: "Invalid activity level value" },
        { status: 400 }
      );
    }

    if (sleepSchedule !== undefined && !validSleep.includes(sleepSchedule)) {
      return NextResponse.json(
        { error: "Invalid sleep schedule value" },
        { status: 400 }
      );
    }

    if (budgetFlexibility !== undefined && !validBudget.includes(budgetFlexibility)) {
      return NextResponse.json(
        { error: "Invalid budget flexibility value" },
        { status: 400 }
      );
    }

    if (accommodationPreference !== undefined && !validAccommodation.includes(accommodationPreference)) {
      return NextResponse.json(
        { error: "Invalid accommodation preference value" },
        { status: 400 }
      );
    }

    // Create or update preferences
    const updateData: any = {};
    if (alcoholConsumption !== undefined) updateData.alcoholConsumption = alcoholConsumption;
    if (smoking !== undefined) updateData.smoking = smoking;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (sleepSchedule !== undefined) updateData.sleepSchedule = sleepSchedule;
    if (budgetFlexibility !== undefined) updateData.budgetFlexibility = budgetFlexibility;
    if (accommodationPreference !== undefined) updateData.accommodationPreference = accommodationPreference;

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    // Update search index after successful preference update
    try {
      const indexResult = await SearchIndexManager.indexUserProfile(userId);
      if (!indexResult.success) {
        console.warn(`[Lifestyle Preferences] Search indexing failed for user ${userId}:`, indexResult.error);
      }
    } catch (indexError) {
      // Log but don't fail the request if indexing fails
      console.error(`[Lifestyle Preferences] Search indexing error for user ${userId}:`, indexError);
    }

    return NextResponse.json(
      {
        message: "Lifestyle preferences updated successfully",
        data: preferences
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/preferences/lifestyle] Error:", error);
    console.error("[POST /api/preferences/lifestyle] Error name:", error.name);
    console.error("[POST /api/preferences/lifestyle] Error message:", error.message);
    console.error("[POST /api/preferences/lifestyle] Stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to update lifestyle preferences",
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preferences/lifestyle
 * Retrieve user's lifestyle preferences
 */
export async function GET(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch preferences
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      return NextResponse.json(
        { data: null, message: "No preferences found" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { data: preferences },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/preferences/lifestyle] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lifestyle preferences" },
      { status: 500 }
    );
  }
}
