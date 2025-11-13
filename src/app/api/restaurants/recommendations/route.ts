import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { FoodPreferences } from "@/models/FoodPreferences";
import { RestaurantRecommendationService } from "@/services/RestaurantRecommendationService";
import { cacheService } from "@/services/CacheService";

/**
 * GET /api/restaurants/recommendations
 * Get restaurant recommendations for a location based on user preferences
 * Query params: lat, lng, mealType, radius (optional)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const mealType = searchParams.get('mealType');
    const radius = searchParams.get('radius');

    // Validate required parameters
    if (!lat || !lng || !mealType) {
      return NextResponse.json(
        { error: "Missing required parameters: lat, lng, mealType" },
        { status: 400 }
      );
    }

    // Validate latitude and longitude
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90, longitude between -180 and 180" },
        { status: 400 }
      );
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: "Invalid meal type. Must be: breakfast, lunch, or dinner" },
        { status: 400 }
      );
    }

    // Parse radius (default 2000m)
    const radiusMeters = radius ? parseInt(radius) : 2000;
    if (isNaN(radiusMeters) || radiusMeters < 100 || radiusMeters > 50000) {
      return NextResponse.json(
        { error: "Radius must be between 100 and 50000 meters" },
        { status: 400 }
      );
    }

    // Fetch user's food preferences
    const foodPrefs = await FoodPreferences.findOne({ userId });

    // Default preferences if not set
    const userPrefs = {
      dietaryRestrictions: foodPrefs?.dietaryRestrictions || [],
      cuisinePreferences: foodPrefs?.cuisinePreferences || [],
      avgMealBudget: foodPrefs?.avgMealBudget || null
    };

    // Create restaurant recommendation service
    const restaurantService = new RestaurantRecommendationService(cacheService);

    // Set timeout for the request (3 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000);
    });

    // Get recommendations with timeout
    const recommendationsPromise = restaurantService.getRecommendations(
      {
        latitude,
        longitude,
        radius: radiusMeters,
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner'
      },
      userPrefs,
      5 // limit to 5 restaurants
    );

    const restaurants = await Promise.race([
      recommendationsPromise,
      timeoutPromise
    ]) as any[];

    return NextResponse.json(
      {
        data: restaurants,
        meta: {
          location: { latitude, longitude },
          mealType,
          radius: radiusMeters,
          count: restaurants.length,
          userPreferences: {
            hasDietaryRestrictions: userPrefs.dietaryRestrictions.length > 0,
            hasCuisinePreferences: userPrefs.cuisinePreferences.length > 0
          }
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/restaurants/recommendations] Error:", error);

    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: "Request timeout - restaurant recommendations took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to fetch restaurant recommendations",
        data: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}
