'use client';

import React, { useState } from 'react';
import '../../styles/design-system.css';

interface LifestylePreferences {
  alcoholConsumption: string | null;
  smoking: string | null;
  activityLevel: string | null;
  sleepSchedule: string | null;
  budgetFlexibility: string | null;
  accommodationPreference: string | null;
}

interface FoodPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  mealTypePreferences: string[];
  allergies: string;
  avgMealBudget: string | null;
}

interface PreferencesSignupFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const PreferencesSignupFlow: React.FC<PreferencesSignupFlowProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lifestylePrefs, setLifestylePrefs] = useState<LifestylePreferences>({
    alcoholConsumption: null,
    smoking: null,
    activityLevel: null,
    sleepSchedule: null,
    budgetFlexibility: null,
    accommodationPreference: null
  });
  
  const [foodPrefs, setFoodPrefs] = useState<FoodPreferences>({
    dietaryRestrictions: [],
    cuisinePreferences: [],
    mealTypePreferences: [],
    allergies: '',
    avgMealBudget: null
  });

  const lifestyleOptions = {
    alcoholConsumption: [
      { value: 'teetotaler', label: "I don't drink" },
      { value: 'occasional', label: 'Occasional drinker' },
      { value: 'regular', label: 'Regular drinker' },
      { value: 'no_preference', label: 'No preference' }
    ],
    smoking: [
      { value: 'non_smoker', label: 'Non-smoker' },
      { value: 'smoker', label: 'Smoker' },
      { value: 'no_preference', label: 'No preference' }
    ],
    activityLevel: [
      { value: 'relaxed', label: 'Relaxed - Slower pace' },
      { value: 'moderate', label: 'Moderate - Mix of activities' },
      { value: 'high_energy', label: 'High Energy - Packed schedule!' }
    ],
    sleepSchedule: [
      { value: 'early_riser', label: 'Early Riser' },
      { value: 'night_owl', label: 'Night Owl' },
      { value: 'flexible', label: 'Flexible' }
    ],
    budgetFlexibility: [
      { value: 'strict', label: 'Strict Budget' },
      { value: 'flexible', label: 'Flexible' },
      { value: 'open_ended', label: 'Open-Ended' }
    ],
    accommodationPreference: [
      { value: 'budget', label: 'Budget' },
      { value: 'mid_range', label: 'Mid-Range' },
      { value: 'luxury', label: 'Luxury' }
    ]
  };

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

  const handleLifestyleChange = (field: keyof LifestylePreferences, value: string) => {
    setLifestylePrefs(prev => ({ ...prev, [field]: value }));
  };

  const handleDietaryChange = (restriction: string) => {
    setFoodPrefs(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleCuisineChange = (cuisine: string) => {
    setFoodPrefs(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const handleMealTypeChange = (mealType: string) => {
    setFoodPrefs(prev => ({
      ...prev,
      mealTypePreferences: prev.mealTypePreferences.includes(mealType)
        ? prev.mealTypePreferences.filter(m => m !== mealType)
        : [...prev.mealTypePreferences, mealType]
    }));
  };

  const saveLifestylePreferences = async () => {
    try {
      const response = await fetch('/api/preferences/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lifestylePrefs)
      });

      if (!response.ok) {
        throw new Error('Failed to save lifestyle preferences');
      }

      return true;
    } catch (error) {
      console.error('Error saving lifestyle preferences:', error);
      throw error;
    }
  };

  const saveFoodPreferences = async () => {
    try {
      const response = await fetch('/api/preferences/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodPrefs)
      });

      if (!response.ok) {
        throw new Error('Failed to save food preferences');
      }

      return true;
    } catch (error) {
      console.error('Error saving food preferences:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    setError(null);
    setLoading(true);

    try {
      if (currentStep === 1) {
        await saveLifestylePreferences();
        setCurrentStep(2);
      } else if (currentStep === 2) {
        await saveFoodPreferences();
        onComplete();
      }
    } catch (error) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const renderProgressIndicator = () => (
    <div className="progress-indicator">
      <div className={`progress-step ${currentStep >= 1 ? 'active' : 'inactive'}`}>
        1
      </div>
      <div className={`progress-line ${currentStep > 1 ? 'completed' : ''}`}></div>
      <div className={`progress-step ${currentStep >= 2 ? 'active' : 'inactive'}`}>
        2
      </div>
    </div>
  );

  const renderLifestyleStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
          Tell us about your <span style={{ color: 'var(--color-soft-terracotta)' }}>travel style</span>
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          This helps us match you with compatible travelers for amazing group experiences.
        </p>
      </div>

      {Object.entries(lifestyleOptions).map(([field, options]) => (
        <div key={field} className="preference-group">
          <label className="preference-label">
            {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </label>
          <div className="preference-options">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                className={`preference-option ${
                  lifestylePrefs[field as keyof LifestylePreferences] === option.value ? 'selected' : ''
                }`}
                onClick={() => handleLifestyleChange(field as keyof LifestylePreferences, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFoodStep = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
          What about your <span style={{ color: 'var(--color-soft-terracotta)' }}>food preferences</span>?
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          We'll recommend restaurants that match your dietary needs and taste preferences.
        </p>
      </div>

      <div className="preference-group">
        <label className="preference-label">Dietary Restrictions</label>
        <div className="checkbox-wrapper">
          {dietaryOptions.map(restriction => (
            <div key={restriction} className="checkbox-item">
              <input
                type="checkbox"
                id={restriction}
                checked={foodPrefs.dietaryRestrictions.includes(restriction)}
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
                checked={foodPrefs.cuisinePreferences.includes(cuisine)}
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
                checked={foodPrefs.mealTypePreferences.includes(mealType)}
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
                foodPrefs.avgMealBudget === option.value ? 'selected' : ''
              }`}
              onClick={() => setFoodPrefs(prev => ({ ...prev, avgMealBudget: option.value }))}
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
          value={foodPrefs.allergies}
          onChange={(e) => setFoodPrefs(prev => ({ ...prev, allergies: e.target.value }))}
          rows={3}
          maxLength={500}
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
        <div className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
          {foodPrefs.allergies.length}/500 characters
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderProgressIndicator()}
      
      <div className="card-featured">
        {currentStep === 1 ? renderLifestyleStep() : renderFoodStep()}
        
        {error && (
          <div className="mt-6 p-4 rounded-lg" style={{ 
            background: 'rgba(183, 75, 75, 0.1)', 
            border: '1px solid var(--status-error)',
            color: 'var(--status-error)'
          }}>
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-8 pt-6" style={{ borderTop: '1px solid var(--color-light-gray)' }}>
          <button
            type="button"
            onClick={handleSkip}
            className="btn-tertiary"
            disabled={loading}
          >
            Skip for now
          </button>
          
          <div className="flex gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary"
                disabled={loading}
              >
                Back
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : currentStep === 2 ? 'Complete' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSignupFlow;
