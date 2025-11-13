'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/design-system.css';

interface FoodPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  mealTypePreferences: string[];
  allergies: string;
  avgMealBudget: string | null;
}

const FoodPreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<FoodPreferences>({
    dietaryRestrictions: [],
    cuisinePreferences: [],
    mealTypePreferences: [],
    allergies: '',
    avgMealBudget: null
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 
    'non_veg', 'halal', 'kosher', 'no_restrictions'
  ];

  const cuisineOptions = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese',
    'Korean', 'Vietnamese', 'French', 'Mediterranean', 'Greek',
    'Spanish', 'American', 'Brazilian', 'Turkish', 'Lebanese'
  ];

  const mealTypeOptions = [
    'street_food', 'fine_dining', 'casual_cafes', 'fast_food', 'local_cuisine'
  ];

  const budgetOptions = [
    { value: 'budget', label: 'Budget-friendly' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'premium', label: 'Premium' }
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/preferences/food');
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setPreferences({
            dietaryRestrictions: result.data.dietaryRestrictions || [],
            cuisinePreferences: result.data.cuisinePreferences || [],
            mealTypePreferences: result.data.mealTypePreferences || [],
            allergies: result.data.allergies || '',
            avgMealBudget: result.data.avgMealBudget || null
          });
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleDietaryChange = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
    setSuccess(false);
  };

  const handleCuisineChange = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
    setSuccess(false);
  };

  const handleMealTypeChange = (mealType: string) => {
    setPreferences(prev => ({
      ...prev,
      mealTypePreferences: prev.mealTypePreferences.includes(mealType)
        ? prev.mealTypePreferences.filter(m => m !== mealType)
        : [...prev.mealTypePreferences, mealType]
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/preferences/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card-featured">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
          Food <span style={{ color: 'var(--color-soft-terracotta)' }}>Preferences</span>
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Customize your dining preferences to get personalized restaurant recommendations.
        </p>
      </div>

      <div className="card-featured">
        <div className="preference-group">
          <label className="preference-label">Dietary Restrictions</label>
          <div className="checkbox-wrapper">
            {dietaryOptions.map(restriction => (
              <div key={restriction} className="checkbox-item">
                <input
                  type="checkbox"
                  id={restriction}
                  checked={preferences.dietaryRestrictions.includes(restriction)}
                  onChange={() => handleDietaryChange(restriction)}
                />
                <label htmlFor={restriction} className="checkbox-label">
                  {restriction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-group">
          <label className="preference-label">Favorite Cuisines</label>
          <div className="checkbox-wrapper">
            {cuisineOptions.map(cuisine => (
              <div key={cuisine} className="checkbox-item">
                <input
                  type="checkbox"
                  id={cuisine}
                  checked={preferences.cuisinePreferences.includes(cuisine)}
                  onChange={() => handleCuisineChange(cuisine)}
                />
                <label htmlFor={cuisine} className="checkbox-label">
                  {cuisine}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-group">
          <label className="preference-label">Meal Types You Enjoy</label>
          <div className="checkbox-wrapper">
            {mealTypeOptions.map(mealType => (
              <div key={mealType} className="checkbox-item">
                <input
                  type="checkbox"
                  id={mealType}
                  checked={preferences.mealTypePreferences.includes(mealType)}
                  onChange={() => handleMealTypeChange(mealType)}
                />
                <label htmlFor={mealType} className="checkbox-label">
                  {mealType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-group">
          <label className="preference-label">Meal Budget Preference</label>
          <div className="preference-options">
            {budgetOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`preference-option ${
                  preferences.avgMealBudget === option.value ? 'selected' : ''
                }`}
                onClick={() => {
                  setPreferences(prev => ({ ...prev, avgMealBudget: option.value }));
                  setSuccess(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-group">
          <label className="preference-label">Allergies or Special Dietary Notes</label>
          <textarea
            className="input"
            placeholder="Any specific allergies or dietary requirements we should know about?"
            value={preferences.allergies}
            onChange={(e) => {
              setPreferences(prev => ({ ...prev, allergies: e.target.value }));
              setSuccess(false);
            }}
            rows={3}
            maxLength={500}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
          <div className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {preferences.allergies.length}/500 characters
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-lg" style={{ 
            background: 'rgba(183, 75, 75, 0.1)', 
            border: '1px solid var(--status-error)',
            color: 'var(--status-error)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 rounded-lg" style={{ 
            background: 'rgba(155, 168, 148, 0.1)', 
            border: '1px solid var(--status-success)',
            color: 'var(--status-success)'
          }}>
            ✓ Preferences saved successfully!
          </div>
        )}

        <div className="flex justify-end mt-8 pt-6" style={{ borderTop: '1px solid var(--color-light-gray)' }}>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodPreferencesSettings;
