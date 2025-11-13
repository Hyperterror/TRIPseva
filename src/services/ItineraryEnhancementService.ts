import { FoodPreferences } from '../models/FoodPreferences';
import { ItineraryRestaurants } from '../models/ItineraryRestaurants';
import { RestaurantRecommendationService } from './RestaurantRecommendationService';
import { cacheService } from './CacheService';
import mongoose from 'mongoose';

interface Activity {
  poi: string;
  time: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
}

/**
 * Service to enhance itineraries with restaurant recommendations
 * This can be called after POI generation to add meal recommendations
 */
export class ItineraryEnhancementService {
  private restaurantService: RestaurantRecommendationService;

  constructor() {
    this.restaurantService = new RestaurantRecommendationService(cacheService);
  }

  /**
   * Add restaurant recommendations to an existing itinerary
   * @param itineraryId - The itinerary ID
   * @param userId - The user ID (for preferences)
   * @param days - Array of itinerary days with activities
   * @returns Promise<void>
   */
  async enhanceItineraryWithRestaurants(
    itineraryId: string,
    userId: string,
    days: ItineraryDay[]
  ): Promise<void> {
    try {
      console.log(`[ItineraryEnhancementService] Enhancing itinerary ${itineraryId} with restaurants`);

      // Fetch user's food preferences
      const foodPrefs = await FoodPreferences.findOne({ userId });

      const userPrefs = {
        dietaryRestrictions: foodPrefs?.dietaryRestrictions || [],
        cuisinePreferences: foodPrefs?.cuisinePreferences || [],
        avgMealBudget: foodPrefs?.avgMealBudget || null
      };

      // Process each day
      for (const day of days) {
        // Extract location from day's activities
        const location = this.extractLocationFromActivities(day.activities);

        if (!location) {
          console.warn(`[ItineraryEnhancementService] No location found for day ${day.day}, skipping restaurants`);
          continue;
        }

        // Generate recommendations for each meal
        const mealSlots: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];

        for (const mealSlot of mealSlots) {
          try {
            const restaurants = await this.restaurantService.getRecommendations(
              {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: 2000, // 2km
                mealType: mealSlot
              },
              userPrefs,
              5 // Get 5 recommendations
            );

            // Store in database
            if (restaurants.length > 0) {
              await ItineraryRestaurants.findOneAndUpdate(
                {
                  itineraryId: new mongoose.Types.ObjectId(itineraryId),
                  dayNumber: day.day,
                  mealSlot
                },
                {
                  restaurants,
                  updatedAt: new Date()
                },
                {
                  upsert: true,
                  new: true
                }
              );

              console.log(`[ItineraryEnhancementService] Added ${restaurants.length} restaurants for day ${day.day}, ${mealSlot}`);
            }
          } catch (error: any) {
            console.error(`[ItineraryEnhancementService] Error fetching restaurants for day ${day.day}, ${mealSlot}:`, error.message);
            // Continue with next meal slot even if this one fails
          }
        }
      }

      console.log(`[ItineraryEnhancementService] Successfully enhanced itinerary ${itineraryId}`);
    } catch (error: any) {
      console.error(`[ItineraryEnhancementService] Error enhancing itinerary:`, error);
      // Don't throw - we want itinerary generation to succeed even if restaurant fetch fails
    }
  }

  /**
   * Extract location coordinates from activities
   * In a real implementation, this would parse POI data or use geocoding
   * For now, returns a placeholder that should be replaced with actual logic
   */
  private extractLocationFromActivities(activities: Activity[]): { latitude: number; longitude: number } | null {
    // Check if any activity has location data
    for (const activity of activities) {
      if (activity.location) {
        return activity.location;
      }
    }

    // TODO: In production, implement one of these strategies:
    // 1. Parse POI names and geocode them
    // 2. Store location data when POIs are fetched
    // 3. Use trip destination coordinates as fallback
    
    // For now, return null to indicate location not available
    return null;
  }

  /**
   * Remove restaurant recommendations for an itinerary
   * Useful for cleanup or regeneration
   */
  async removeRestaurantRecommendations(itineraryId: string): Promise<void> {
    try {
      await ItineraryRestaurants.deleteMany({
        itineraryId: new mongoose.Types.ObjectId(itineraryId)
      });
      console.log(`[ItineraryEnhancementService] Removed restaurant recommendations for itinerary ${itineraryId}`);
    } catch (error: any) {
      console.error(`[ItineraryEnhancementService] Error removing restaurants:`, error);
      throw error;
    }
  }

  /**
   * Regenerate restaurant recommendations for an itinerary
   */
  async regenerateRestaurantRecommendations(
    itineraryId: string,
    userId: string,
    days: ItineraryDay[]
  ): Promise<void> {
    await this.removeRestaurantRecommendations(itineraryId);
    await this.enhanceItineraryWithRestaurants(itineraryId, userId, days);
  }
}

// Singleton instance
export const itineraryEnhancementService = new ItineraryEnhancementService();
