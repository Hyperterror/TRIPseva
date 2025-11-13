'use client';

import React, { useState } from 'react';
import StarRating from '@/components/ratings/StarRating';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import '../../styles/design-system.css';

export default function TestComponentsPage() {
  const [rating, setRating] = useState(0);

  const sampleRestaurant = {
    placeId: 'test-123',
    name: 'The Wanderlust Café',
    cuisineTypes: ['Italian', 'Mediterranean', 'Vegetarian'],
    rating: 4.5,
    priceLevel: 2,
    distance: 1.2,
    address: '123 Adventure Street, Travel City',
    openingHours: [
      'Monday: 9:00 AM - 10:00 PM',
      'Tuesday: 9:00 AM - 10:00 PM',
      'Wednesday: 9:00 AM - 10:00 PM',
      'Thursday: 9:00 AM - 10:00 PM',
      'Friday: 9:00 AM - 11:00 PM',
      'Saturday: 10:00 AM - 11:00 PM',
      'Sunday: 10:00 AM - 9:00 PM'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    reviewSnippet: 'Amazing atmosphere and delicious food! Perfect spot for travelers.',
    googleMapsUrl: 'https://maps.google.com'
  };

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-warm-brown)' }}>
            TripSync <span style={{ color: 'var(--color-soft-terracotta)' }}>Component Showcase</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Testing the beautiful design system components
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div 
                className="h-24 rounded-lg mb-2"
                style={{ background: 'var(--color-warm-brown)' }}
              ></div>
              <p className="text-sm font-semibold">Warm Brown</p>
            </div>
            <div className="text-center">
              <div 
                className="h-24 rounded-lg mb-2"
                style={{ background: 'var(--color-soft-terracotta)' }}
              ></div>
              <p className="text-sm font-semibold">Soft Terracotta</p>
            </div>
            <div className="text-center">
              <div 
                className="h-24 rounded-lg mb-2 border"
                style={{ background: 'var(--color-cream)' }}
              ></div>
              <p className="text-sm font-semibold">Cream</p>
            </div>
            <div className="text-center">
              <div 
                className="h-24 rounded-lg mb-2"
                style={{ background: 'var(--color-sage-green)' }}
              ></div>
              <p className="text-sm font-semibold">Sage Green</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-tertiary">Tertiary Button</button>
            <button className="btn-primary" disabled>Disabled Button</button>
          </div>
        </section>

        {/* Star Rating */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Star Rating Component
          </h2>
          <div className="card-featured p-8">
            <div className="space-y-6">
              <div>
                <p className="mb-3 font-semibold">Interactive (click to rate):</p>
                <StarRating rating={rating} onRatingChange={setRating} size="large" />
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Current rating: {rating} stars
                </p>
              </div>
              <div>
                <p className="mb-3 font-semibold">Read-only display:</p>
                <StarRating rating={4.5} readonly showHalfStars size="medium" />
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Card */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Restaurant Card Component
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RestaurantCard restaurant={sampleRestaurant} />
          </div>
        </section>

        {/* Preference Options */}
        <section>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Preference Selection
          </h2>
          <div className="preference-group">
            <label className="preference-label">Activity Level</label>
            <div className="preference-options">
              <button className="preference-option">Relaxed</button>
              <button className="preference-option selected">Moderate</button>
              <button className="preference-option">High Energy</button>
            </div>
          </div>
        </section>

        {/* Navigation Links */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-warm-brown)' }}>
            Try the Real Pages
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/preferences" className="btn-primary">
              View Preferences Page
            </a>
            <a href="/profile" className="btn-secondary">
              View Profile Page
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
