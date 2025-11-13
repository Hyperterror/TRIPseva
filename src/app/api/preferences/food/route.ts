import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { FoodPreferences } from "@/models/FoodPreferences";
import { sanitizeArray, sanitizeText } from "@/lib/sanitize";
import { authLogger } from "@/lib/authLogger";

/**
 * POST /api/preferences/food
 * Create or update user food preferences
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
      dietaryRestrictions,
      cuisinePreferences,
      mealTypePreferences,
      allergies,
      avgMealBudget
    } = body;

    // Validate arrays
    if (dietaryRestrictions !== undefined && !Array.isArray(dietaryRestrictions)) {
      return NextResponse.json(
        { error: "Dietary restrictions must be an array" },
        { status: 400 }
      );
    }

    if (cuisinePreferences !== undefined && !Array.isArray(cuisinePreferences)) {
      return NextResponse.json(
        { error: "Cuisine preferences must be an array" },
        { status: 400 }
      );
    }

    if (mealTypePreferences !== undefined && !Array.isArray(mealTypePreferences)) {
      return NextResponse.json(
        { error: "Meal type preferences must be an array" },
        { status: 400 }
      );
    }

    // Validate allergies length
    if (allergies && typeof allergies === 'string' && allergies.length > 500) {
      return NextResponse.json(
        { error: "Allergies description cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Validate meal budget
    const validBudget = ['budget', 'moderate', 'premium', null];
    if (avgMealBudget !== undefined && !validBudget.includes(avgMealBudget)) {
      return NextResponse.json(
        { error: "Invalid meal budget value" },
        { status: 400 }
      );
    }

    // Sanitize and create or update preferences
    const updateData: any = {};
    if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = sanitizeArray(dietaryRestrictions);
    if (cuisinePreferences !== undefined) updateData.cuisinePreferences = sanitizeArray(cuisinePreferences);
    if (mealTypePreferences !== undefined) updateData.mealTypePreferences = sanitizeArray(mealTypePreferences);
    if (allergies !== undefined) updateData.allergies = sanitizeText(allergies).substring(0, 500);
    if (avgMealBudget !== undefined) updateData.avgMealBudget = avgMealBudget;

    const preferences = await FoodPreferences.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "Food preferences updated successfully",
        data: preferences
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/preferences/food] Error:", error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update food preferences" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preferences/food
 * Retrieve user's food preferences
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
    const preferences = await FoodPreferences.findOne({ userId });

    if (!preferences) {
      return NextResponse.json(
        { data: null, message: "No food preferences found" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { data: preferences },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/preferences/food] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food preferences" },
      { status: 500 }
    );
  }
}
