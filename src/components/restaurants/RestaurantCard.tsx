'use client';

import React, { useState } from 'react';
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

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const [showHours, setShowHours] = useState(false);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} style={{ color: 'var(--color-warm-gold)' }}>★</span>
        ))}
        {hasHalfStar && <span style={{ color: 'var(--color-warm-gold)' }}>⯨</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} style={{ color: 'var(--color-light-gray)' }}>★</span>
        ))}
      </div>
    );
  };

  const renderPriceLevel = (level: number) => {
    return (
      <div className="flex items-center">
        {[...Array(level)].map((_, i) => (
          <span key={`price-${i}`} style={{ color: 'var(--color-sage-green)' }}>$</span>
        ))}
        {[...Array(4 - level)].map((_, i) => (
          <span key={`empty-price-${i}`} style={{ color: 'var(--color-light-gray)' }}>$</span>
        ))}
      </div>
    );
  };

  return (
    <div className="restaurant-card">
      {/* Restaurant Image */}
      {restaurant.photoUrl && (
        <div className="w-full h-48 rounded-lg overflow-hidden mb-3">
          <img
            src={restaurant.photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      )}

      {/* Header */}
      <div className="restaurant-header">
        <div className="flex-1">
          <h4 className="restaurant-name">{restaurant.name}</h4>
          <div className="restaurant-tags">
            {restaurant.cuisineTypes.slice(0, 3).map((cuisine, index) => (
              <span key={index} className="restaurant-tag">
                {cuisine}
              </span>
            ))}
          </div>
        </div>
        <div className="restaurant-rating">
          ⭐ {restaurant.rating.toFixed(1)}
        </div>
      </div>

      {/* Star Rating Display */}
      <div className="flex items-center gap-2 mb-3">
        {renderStars(restaurant.rating)}
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          ({restaurant.rating.toFixed(1)})
        </span>
      </div>

      {/* Info Row */}
      <div className="restaurant-info">
        <span>📍 {restaurant.distance.toFixed(1)} km away</span>
        <div className="flex items-center gap-1">
          <span>💰</span>
          {renderPriceLevel(restaurant.priceLevel)}
        </div>
      </div>

      {/* Address */}
      <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        📍 {restaurant.address}
      </div>

      {/* Review Snippet */}
      {restaurant.reviewSnippet && (
        <div 
          className="text-sm mb-3 p-3 rounded-lg" 
          style={{ 
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}
        >
          "{restaurant.reviewSnippet}"
        </div>
      )}

      {/* Opening Hours */}
      {restaurant.openingHours && restaurant.openingHours.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowHours(!showHours)}
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: 'var(--color-soft-terracotta)' }}
          >
            <span>{showHours ? '▼' : '▶'}</span>
            Opening Hours
          </button>
          {showHours && (
            <div 
              className="mt-2 p-3 rounded-lg text-sm"
              style={{ 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-light-gray)'
              }}
            >
              {restaurant.openingHours.map((hours, index) => (
                <div key={index} style={{ color: 'var(--text-secondary)' }}>
                  {hours}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View on Maps Button */}
      <a
        href={restaurant.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="restaurant-cta inline-flex items-center gap-2"
      >
        View on Google Maps →
      </a>
    </div>
  );
};

export default RestaurantCard;
