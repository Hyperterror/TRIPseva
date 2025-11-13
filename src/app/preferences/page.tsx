'use client';

import React, { useState } from 'react';
import LifestylePreferencesSettings from '@/components/preferences/LifestylePreferencesSettings';
import FoodPreferencesSettings from '@/components/preferences/FoodPreferencesSettings';
import DeletePreferencesButton from '@/components/preferences/DeletePreferencesButton';
import '../../styles/design-system.css';

export default function PreferencesPage() {
  const [activeTab, setActiveTab] = useState<'lifestyle' | 'food'>('lifestyle');

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-warm-brown)' }}>
            Travel <span style={{ color: 'var(--color-soft-terracotta)' }}>Preferences</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Customize your preferences to get better matches and recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg p-1" style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--color-light-gray)'
          }}>
            <button
              onClick={() => setActiveTab('lifestyle')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'lifestyle'
                  ? 'btn-primary'
                  : 'bg-transparent'
              }`}
              style={activeTab !== 'lifestyle' ? { color: 'var(--text-secondary)' } : {}}
            >
              Lifestyle Preferences
            </button>
            <button
              onClick={() => setActiveTab('food')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'food'
                  ? 'btn-primary'
                  : 'bg-transparent'
              }`}
              style={activeTab !== 'food' ? { color: 'var(--text-secondary)' } : {}}
            >
              Food Preferences
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'lifestyle' ? (
            <LifestylePreferencesSettings />
          ) : (
            <FoodPreferencesSettings />
          )}
        </div>
      </div>
    </div>
  );
}

        {/* Delete Preferences Section */}
        <div className="max-w-4xl mx-auto mt-8">
          <DeletePreferencesButton />
        </div>
