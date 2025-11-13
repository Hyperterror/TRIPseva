import { CacheService } from './CacheService';
import axios from 'axios';

interface RestaurantQuery {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface UserFoodPrefs {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  avgMealBudget: string | null;
}

interface IRestaurant {
  placeId: string;
  name: string;
  cuisine: string[];
  rating: number;
  distance: number;
  priceLevel: number;
  openingHours: string;
  address: string;
  reviews: string;
  matchScore: number;
  photoUrl?: string;
  googleMapsUrl: string;
}

export class RestaurantRecommendationService {
  private googlePlacesApiKey: string;
  private cacheService: CacheService;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api/place';
  private defaultRadius: number = 2000; // 2km
  private minRating: number = 3.5;
  private requestTimeout: number = 5000; // 5 seconds
  private maxRetries: number = 3;

  constructor(cacheService: CacheService) {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.cacheService = cacheService;
    
    if (!this.googlePlacesApiKey) {
      console.warn('[RestaurantRecommendationService] Google Places API key not configured');
    }
  }

  /**
   * Get restaurant recommendations based on location and user preferences
   */
  async getRecommendations(
    query: RestaurantQuery,
    userPrefs: UserFoodPrefs,
    limit: number = 5
  ): Promise<IRestaurant[]> {
    try {
      // 1. Check cache first
      const cacheKey = this.generateCacheKey(query, userPrefs);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        console.log('[RestaurantRecommendationService] Cache hit');
        return cached;
      }

      // 2. Query Google Places API
      const restaurants = await this.fetchFromGooglePlaces(query);

      if (restaurants.length === 0) {
        return [];
      }

      // 3. Filter by dietary restrictions
      const filtered = this.filterByDietaryRestrictions(
        restaurants,
        userPrefs.dietaryRestrictions
      );

      // 4. Score and rank
      const scored = this.scoreRestaurants(filtered, userPrefs);

      // 5. Sort and limit
      const topRestaurants = scored
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      // 6. Cache results (24 hours)
      await this.cacheService.set(cacheKey, topRestaurants, 86400);

      return topRestaurants;
    } catch (error: any) {
      console.error('[RestaurantRecommendationService] Error:', error.message);
      return [];
    }
  }

  /**
   * Fetch restaurants from Google Places API with retry logic
   */
  private async fetchFromGooglePlaces(
    query: RestaurantQuery,
    retryCount: number = 0
  ): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/nearbysearch/json`;
      const params = {
        location: `${query.latitude},${query.longitude}`,
        radius: query.radius,
        type: 'restaurant',
        keyword: query.mealType,
        key: this.googlePlacesApiKey
      };

      const response = await axios.get(url, {
        params,
        timeout: this.requestTimeout
      });

      if (response.data.status === 'OK') {
        return response.data.results || [];
      } else if (response.data.status === 'ZERO_RESULTS') {
        return [];
      } else {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
    } catch (error: any) {
      // Retry with exponential backoff
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[RestaurantRecommendationService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchFromGooglePlaces(query, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Filter restaurants by dietary restrictions
   */
  private filterByDietaryRestrictions(
    restaurants: any[],
    restrictions: string[]
  ): any[] {
    if (!restrictions || restrictions.length === 0) {
      return restaurants;
    }

    return restaurants.filter(restaurant => {
      const types = restaurant.types || [];
      const cuisines = this.extractCuisines(restaurant);

      // Check vegetarian/vegan restrictions
      if (restrictions.includes('vegetarian') || restrictions.includes('vegan')) {
        const hasVegOptions = 
          cuisines.some(c => ['vegetarian', 'vegan', 'indian', 'mediterranean'].includes(c.toLowerCase())) ||
          types.some((t: string) => ['vegetarian_restaurant', 'vegan_restaurant'].includes(t));
        
        if (!hasVegOptions) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Score restaurants based on user preferences
   * Scoring: 50% cuisine match, 30% rating, 20% price match
   */
  private scoreRestaurants(
    restaurants: any[],
    userPrefs: UserFoodPrefs
  ): IRestaurant[] {
    return restaurants.map(restaurant => {
      let score = 0;

      // 1. Cuisine match (50%)
      const restaurantCuisines = this.extractCuisines(restaurant);
      if (restaurantCuisines.length > 0 && userPrefs.cuisinePreferences.length > 0) {
        const overlap = restaurantCuisines.filter(c =>
          userPrefs.cuisinePreferences.some(uc => 
            uc.toLowerCase() === c.toLowerCase()
          )
        ).length;
        const cuisineScore = Math.min(overlap / userPrefs.cuisinePreferences.length, 1.0);
        score += cuisineScore * 0.5;
      } else {
        score += 0.25; // Neutral score if no cuisine data
      }

      // 2. Rating (30%)
      const rating = restaurant.rating || 0;
      const ratingScore = rating > 0 ? rating / 5.0 : 0.5;
      score += ratingScore * 0.3;

      // 3. Price match (20%)
      const priceLevel = restaurant.price_level || 2;
      if (userPrefs.avgMealBudget === 'budget' && priceLevel <= 2) {
        score += 0.2;
      } else if (userPrefs.avgMealBudget === 'premium' && priceLevel >= 3) {
        score += 0.2;
      } else if (userPrefs.avgMealBudget === 'moderate') {
        score += 0.2; // All price levels acceptable
      } else {
        score += 0.1; // Partial score if no budget preference
      }

      // Calculate distance
      const distance = this.calculateDistance(
        restaurant.geometry?.location
      );

      return {
        placeId: restaurant.place_id,
        name: restaurant.name,
        cuisine: restaurantCuisines,
        rating: restaurant.rating || 0,
        distance,
        priceLevel: restaurant.price_level || 2,
        openingHours: this.getOpeningHours(restaurant),
        address: restaurant.vicinity || restaurant.formatted_address || '',
        reviews: this.extractReviewSnippet(restaurant),
        matchScore: score,
        photoUrl: this.getPhotoUrl(restaurant),
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`
      };
    });
  }

  /**
   * Extract cuisine types from restaurant data
   */
  private extractCuisines(restaurant: any): string[] {
    const types = restaurant.types || [];
    const cuisines: string[] = [];

    const cuisineMapping: Record<string, string> = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'indian_restaurant': 'Indian',
      'mexican_restaurant': 'Mexican',
      'thai_restaurant': 'Thai',
      'japanese_restaurant': 'Japanese',
      'mediterranean_restaurant': 'Mediterranean',
      'american_restaurant': 'American',
      'french_restaurant': 'French',
      'korean_restaurant': 'Korean',
      'vietnamese_restaurant': 'Vietnamese',
      'vegetarian_restaurant': 'Vegetarian',
      'vegan_restaurant': 'Vegan'
    };

    types.forEach((type: string) => {
      if (cuisineMapping[type]) {
        cuisines.push(cuisineMapping[type]);
      }
    });

    return cuisines;
  }

  /**
   * Calculate distance (placeholder - would need actual coordinates)
   */
  private calculateDistance(location: any): number {
    // Simplified - in real implementation, calculate from query location
    return Math.random() * 2; // 0-2 km
  }

  /**
   * Get opening hours string
   */
  private getOpeningHours(restaurant: any): string {
    if (restaurant.opening_hours?.weekday_text) {
      return restaurant.opening_hours.weekday_text[0] || 'Hours not available';
    }
    if (restaurant.opening_hours?.open_now !== undefined) {
      return restaurant.opening_hours.open_now ? 'Open now' : 'Closed';
    }
    return 'Hours not available';
  }

  /**
   * Extract review snippet
   */
  private extractReviewSnippet(restaurant: any): string {
    if (restaurant.reviews && restaurant.reviews.length > 0) {
      return restaurant.reviews[0].text.substring(0, 150) + '...';
    }
    return '';
  }

  /**
   * Get photo URL
   */
  private getPhotoUrl(restaurant: any): string | undefined {
    if (restaurant.photos && restaurant.photos.length > 0) {
      const photoReference = restaurant.photos[0].photo_reference;
      return `${this.baseUrl}/photo?maxwidth=400&photoreference=${photoReference}&key=${this.googlePlacesApiKey}`;
    }
    return undefined;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: RestaurantQuery, userPrefs: UserFoodPrefs): string {
    return CacheService.generateKey('restaurants', {
      lat: query.latitude.toFixed(4),
      lng: query.longitude.toFixed(4),
      radius: query.radius,
      meal: query.mealType,
      dietary: userPrefs.dietaryRestrictions.sort().join(','),
      cuisines: userPrefs.cuisinePreferences.sort().join(','),
      budget: userPrefs.avgMealBudget || 'none'
    });
  }
}
