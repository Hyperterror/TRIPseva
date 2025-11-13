import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Restaurant {
  placeId: string;
  name: string;
  cuisineTypes: string[];
  rating: number;
  priceLevel: number;
  distance: number;
  address: string;
  openingHours?: string[];
  photoUrl?: string;
}

interface MealSlot {
  breakfast: Restaurant[];
  lunch: Restaurant[];
  dinner: Restaurant[];
}

interface UseRestaurantsReturn {
  restaurants: MealSlot | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache to avoid redundant fetches
const cache = new Map<string, { data: MealSlot; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useRestaurants = (
  itineraryId: string | null,
  dayNumber: number | null
): UseRestaurantsReturn => {
  const [restaurants, setRestaurants] = useState<MealSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    if (!itineraryId || dayNumber === null) {
      return;
    }

    const cacheKey = `${itineraryId}-${dayNumber}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRestaurants(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/itineraries/${itineraryId}/restaurants/day/${dayNumber}`
      );
      
      const data = response.data.data;
      const mealSlot: MealSlot = {
        breakfast: data.meals.breakfast || [],
        lunch: data.meals.lunch || [],
        dinner: data.meals.dinner || []
      };
      
      setRestaurants(mealSlot);
      
      // Update cache
      cache.set(cacheKey, { data: mealSlot, timestamp: Date.now() });
    } catch (err: any) {
      console.error('Error fetching restaurants:', err);
      setError(err.response?.data?.error || 'Failed to fetch restaurants');
      setRestaurants({ breakfast: [], lunch: [], dinner: [] });
    } finally {
      setLoading(false);
    }
  }, [itineraryId, dayNumber]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    refetch: fetchRestaurants
  };
};
