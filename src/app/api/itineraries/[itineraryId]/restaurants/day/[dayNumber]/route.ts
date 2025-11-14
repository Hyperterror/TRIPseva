import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ItineraryRestaurants } from "@/models/ItineraryRestaurants";
import mongoose from "mongoose";

/**
 * GET /api/itineraries/:itineraryId/restaurants/day/:dayNumber
 * Get restaurant recommendations for a specific day
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; dayNumber: string }> }
) {
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

    const { itineraryId, dayNumber } = await params;

    // Validate itineraryId format
    if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
      return NextResponse.json(
        { error: "Invalid itinerary ID format" },
        { status: 400 }
      );
    }

    // Validate dayNumber
    const day = parseInt(dayNumber);
    if (isNaN(day) || day < 1) {
      return NextResponse.json(
        { error: "Invalid day number. Must be a positive integer" },
        { status: 400 }
      );
    }

    // Fetch restaurants for this specific day
    const restaurants = await ItineraryRestaurants.find({
      itineraryId: new mongoose.Types.ObjectId(itineraryId),
      dayNumber: day
    }).sort({ mealSlot: 1 });

    if (restaurants.length === 0) {
      return NextResponse.json(
        {
          data: {
            dayNumber: day,
            meals: {
              breakfast: { restaurants: [] },
              lunch: { restaurants: [] },
              dinner: { restaurants: [] }
            }
          },
          message: "No restaurant recommendations found for this day"
        },
        { status: 200 }
      );
    }

    // Group by meal slot
    const meals: Record<string, any> = {
      breakfast: { restaurants: [] },
      lunch: { restaurants: [] },
      dinner: { restaurants: [] }
    };

    restaurants.forEach(item => {
      meals[item.mealSlot] = {
        mealSlot: item.mealSlot,
        restaurants: item.restaurants,
        updatedAt: item.updatedAt
      };
    });

    return NextResponse.json(
      {
        data: {
          dayNumber: day,
          meals
        },
        meta: {
          itineraryId,
          dayNumber: day,
          mealsWithRecommendations: restaurants.length
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/itineraries/:itineraryId/restaurants/day/:dayNumber] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants for this day" },
      { status: 500 }
    );
  }
}
