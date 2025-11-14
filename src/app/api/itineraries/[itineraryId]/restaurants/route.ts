import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ItineraryRestaurants } from "@/models/ItineraryRestaurants";
import mongoose from "mongoose";

/**
 * GET /api/itineraries/:itineraryId/restaurants
 * Get all restaurant recommendations for an itinerary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
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

    const { itineraryId } = await params;

    // Validate itineraryId format
    if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
      return NextResponse.json(
        { error: "Invalid itinerary ID format" },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to this itinerary
    // This would require checking the Itinerary model and TripGroup membership
    // For now, we'll fetch the restaurants

    // Fetch all restaurants for this itinerary
    const restaurants = await ItineraryRestaurants.find({ 
      itineraryId: new mongoose.Types.ObjectId(itineraryId)
    }).sort({ dayNumber: 1, mealSlot: 1 });

    if (restaurants.length === 0) {
      return NextResponse.json(
        { 
          data: [],
          message: "No restaurant recommendations found for this itinerary"
        },
        { status: 200 }
      );
    }

    // Group restaurants by day
    const groupedByDay: Record<number, any> = {};

    restaurants.forEach(item => {
      if (!groupedByDay[item.dayNumber]) {
        groupedByDay[item.dayNumber] = {
          dayNumber: item.dayNumber,
          meals: {}
        };
      }

      groupedByDay[item.dayNumber].meals[item.mealSlot] = {
        mealSlot: item.mealSlot,
        restaurants: item.restaurants,
        updatedAt: item.updatedAt
      };
    });

    // Convert to array and sort by day
    const result = Object.values(groupedByDay).sort((a, b) => a.dayNumber - b.dayNumber);

    return NextResponse.json(
      {
        data: result,
        meta: {
          itineraryId,
          totalDays: result.length,
          totalMeals: restaurants.length
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/itineraries/:itineraryId/restaurants] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary restaurants" },
      { status: 500 }
    );
  }
}
