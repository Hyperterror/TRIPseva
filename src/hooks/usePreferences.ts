import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface LifestylePreferences {
  smokingPreference?: string;
  drinkingPreference?: string;
  activityLevel?: string;
  sleepSchedule?: string;
  budgetFlexibility?: string;
  accommodationPreference?: string;
}

interface FoodPreferences {
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  spiceLevel?: string;
  allergies?: string;
  mealBudget?: string;
}

interface UsePreferencesReturn {
  lifestyle: LifestylePreferences | null;
  food: FoodPreferences | null;
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updateLifestylePrefs: (prefs: LifestylePreferences) => Promise<void>;
  updateFoodPrefs: (prefs: FoodPreferences) => Promise<void>;
}

export const usePreferences = (): UsePreferencesReturn => {
  const [lifestyle, setLifestyle] = useState<LifestylePreferences | null>(null);
  const [food, setFood] = useState<FoodPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [lifestyleRes, foodRes] = await Promise.all([
        axios.get('/api/preferences/lifestyle'),
        axios.get('/api/preferences/food')
      ]);
      
      setLifestyle(lifestyleRes.data);
      setFood(foodRes.data);
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      setError(err.response?.data?.error || 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLifestylePrefs = useCallback(async (prefs: LifestylePreferences) => {
    setError(null);
    
    try {
      const response = await axios.post('/api/preferences/lifestyle', prefs);
      setLifestyle(response.data);
    } catch (err: any) {
      console.error('Error updating lifestyle preferences:', err);
      setError(err.response?.data?.error || 'Failed to update lifestyle preferences');
      throw err;
    }
  }, []);

  const updateFoodPrefs = useCallback(async (prefs: FoodPreferences) => {
    setError(null);
    
    try {
      const response = await axios.post('/api/preferences/food', prefs);
      setFood(response.data);
    } catch (err: any) {
      console.error('Error updating food preferences:', err);
      setError(err.response?.data?.error || 'Failed to update food preferences');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    lifestyle,
    food,
    loading,
    error,
    fetchPreferences,
    updateLifestylePrefs,
    updateFoodPrefs
  };
};
