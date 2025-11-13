'use client';

import React, { useState, useEffect } from 'react';
import RestaurantCard from './RestaurantCard';
import '../../styles/design-system.css';

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
  reviewSnippet?: string;
  googleMapsUrl: string;
}

interface RestaurantRecommendationsProps {
  itineraryId: string;
  dayNumber: number;
  mealSlot: 'breakfast' | 'lunch' | 'dinner';
}

const RestaurantRecommendations: React.FC<RestaurantRecommendationsProps> = ({
  itineraryId,
  dayNumber,
  mealSlot
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, [itineraryId, dayNumber, mealSlot]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/itineraries/${itineraryId}/restaurants/day/${dayNumber}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      
      // Extract restaurants for the specific meal slot
      const mealRestaurants = data.restaurants?.[mealSlot] || [];
      setRestaurants(mealRestaurants);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Unable to load restaurant recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = () => {
    switch (mealSlot) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      default:
        return '🍽️';
    }
  };

  const getMealTitle = () => {
    return mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{getMealIcon()}</span>
          <h3 className="text-xl font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
            {getMealTitle()} Recommendations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-featured animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg" style={{ 
        background: 'rgba(183, 75, 75, 0.1)', 
        border: '1px solid var(--status-error)',
        color: 'var(--status-error)'
      }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚠️</span>
          <h4 className="font-semibold">Error Loading Restaurants</h4>
        </div>
        <p>{error}</p>
        <button
          onClick={fetchRestaurants}
          className="btn-secondary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-6 rounded-lg text-center" style={{ 
        background: 'var(--bg-secondary)',
        border: '1px solid var(--color-light-gray)'
      }}>
        <div className="text-4xl mb-3">{getMealIcon()}</div>
        <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
          No {getMealTitle()} Recommendations Yet
        </h4>
        <p style={{ color: 'var(--text-secondary)' }}>
          We couldn't find restaurants for this meal slot. Try exploring the area or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{getMealIcon()}</span>
        <h3 className="text-xl font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
          {getMealTitle()} Recommendations
        </h3>
        <span 
          className="ml-2 px-3 py-1 rounded-full text-sm font-semibold"
          style={{ 
            background: 'var(--color-sage-green)',
            color: 'white'
          }}
        >
          {restaurants.length} {restaurants.length === 1 ? 'option' : 'options'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.placeId} restaurant={restaurant} />
        ))}
      </div>
    </div>
  );
};

export default RestaurantRecommendations;
