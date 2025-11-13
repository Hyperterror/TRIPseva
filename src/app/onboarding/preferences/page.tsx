'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PreferencesSignupFlow from '@/components/preferences/PreferencesSignupFlow';

export default function PreferencesOnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to dashboard after completing preferences
    router.push('/');
  };

  const handleSkip = () => {
    // Allow users to skip and go to dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <PreferencesSignupFlow onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}
