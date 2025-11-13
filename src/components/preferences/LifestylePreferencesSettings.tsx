'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/design-system.css';

interface LifestylePreferences {
  alcoholConsumption: string | null;
  smoking: string | null;
  activityLevel: string | null;
  sleepSchedule: string | null;
  budgetFlexibility: string | null;
  accommodationPreference: string | null;
}

const LifestylePreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<LifestylePreferences>({
    alcoholConsumption: null,
    smoking: null,
    activityLevel: null,
    sleepSchedule: null,
    budgetFlexibility: null,
    accommodationPreference: null
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/preferences/lifestyle');
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setPreferences({
            alcoholConsumption: result.data.alcoholConsumption || null,
            smoking: result.data.smoking || null,
            activityLevel: result.data.activityLevel || null,
            sleepSchedule: result.data.sleepSchedule || null,
            budgetFlexibility: result.data.budgetFlexibility || null,
            accommodationPreference: result.data.accommodationPreference || null
          });
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field: keyof LifestylePreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/preferences/lifestyle', {
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
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
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
          Lifestyle <span style={{ color: 'var(--color-soft-terracotta)' }}>Preferences</span>
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Update your travel style preferences to help us match you with compatible travelers.
        </p>
      </div>

      <div className="card-featured">
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
                    preferences[field as keyof LifestylePreferences] === option.value ? 'selected' : ''
                  }`}
                  onClick={() => handleChange(field as keyof LifestylePreferences, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}

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

export default LifestylePreferencesSettings;
