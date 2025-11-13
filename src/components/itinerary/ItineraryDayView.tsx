'use client';

import React, { useState } from 'react';
import RestaurantRecommendations from '../restaurants/RestaurantRecommendations';
import '../../styles/design-system.css';

interface Activity {
  time: string;
  title: string;
  description?: string;
  location?: string;
}

interface ItineraryDayViewProps {
  itineraryId: string;
  dayNumber: number;
  date: string;
  activities: Activity[];
}

type MealSlot = 'breakfast' | 'lunch' | 'dinner';

const ItineraryDayView: React.FC<ItineraryDayViewProps> = ({
  itineraryId,
  dayNumber,
  date,
  activities
}) => {
  const [expandedMeal, setExpandedMeal] = useState<MealSlot | null>(null);

  const toggleMeal = (meal: MealSlot) => {
    setExpandedMeal(expandedMeal === meal ? null : meal);
  };

  const mealSlots = [
    { slot: 'breakfast' as MealSlot, icon: '🌅', label: 'Breakfast', time: '7:00 AM - 10:00 AM' },
    { slot: 'lunch' as MealSlot, icon: '☀️', label: 'Lunch', time: '12:00 PM - 2:00 PM' },
    { slot: 'dinner' as MealSlot, icon: '🌙', label: 'Dinner', time: '6:00 PM - 9:00 PM' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Day Header */}
      <div 
        className="p-6 rounded-lg"
        style={{ 
          background: 'var(--gradient-earthy)',
          border: '2px solid var(--color-soft-terracotta)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-warm-brown)' }}>
            Day {dayNumber}
          </h2>
          <span 
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ 
              background: 'var(--color-warm-gold)',
              color: 'var(--text-primary)'
            }}
          >
            {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
          </span>
        </div>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(date)}
        </p>
      </div>

      {/* Activities List */}
      {activities.length > 0 && (
        <div 
          className="p-6 rounded-lg"
          style={{ 
            background: 'var(--bg-card)',
            border: '1px solid var(--color-light-gray)'
          }}
        >
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
            📍 Activities
          </h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg"
                style={{ 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-light-gray)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="px-3 py-1 rounded-md text-sm font-semibold"
                    style={{ 
                      background: 'var(--color-dusty-blue)',
                      color: 'white'
                    }}
                  >
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {activity.title}
                    </h4>
                    {activity.description && (
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {activity.description}
                      </p>
                    )}
                    {activity.location && (
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        📍 {activity.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Slots */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
          🍽️ Dining Recommendations
        </h3>
        
        {mealSlots.map(({ slot, icon, label, time }) => (
          <div 
            key={slot}
            className="rounded-lg overflow-hidden"
            style={{ 
              background: 'var(--bg-card)',
              border: '2px solid var(--color-light-gray)'
            }}
          >
            {/* Meal Slot Header */}
            <button
              onClick={() => toggleMeal(slot)}
              className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
              style={{ 
                background: expandedMeal === slot 
                  ? 'var(--gradient-button-primary)' 
                  : 'var(--bg-secondary)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="text-left">
                  <h4 
                    className="font-semibold text-lg"
                    style={{ 
                      color: expandedMeal === slot ? 'white' : 'var(--color-warm-brown)' 
                    }}
                  >
                    {label}
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: expandedMeal === slot ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' 
                    }}
                  >
                    {time}
                  </p>
                </div>
              </div>
              <span 
                className="text-2xl transition-transform"
                style={{ 
                  transform: expandedMeal === slot ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: expandedMeal === slot ? 'white' : 'var(--color-soft-terracotta)'
                }}
              >
                ▼
              </span>
            </button>

            {/* Meal Slot Content */}
            {expandedMeal === slot && (
              <div className="p-6 animate-fade-in">
                <RestaurantRecommendations
                  itineraryId={itineraryId}
                  dayNumber={dayNumber}
                  mealSlot={slot}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryDayView;
