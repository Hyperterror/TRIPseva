"use client";

import Link from "next/link";
import { Users, Heart, MapPin, Star, Utensils, Sparkles, Calendar, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import '../styles/design-system.css';

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            background: 'radial-gradient(circle at 30% 20%, var(--color-warm-gold) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--color-soft-terracotta) 0%, transparent 50%)'
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 md:px-16 text-center">
          <div className="flex justify-center mb-6">
            <div 
              className="p-4 rounded-full animate-pulse"
              style={{ background: 'var(--gradient-adventure)' }}
            >
              <MapPin className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ 
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'var(--color-warm-brown)' 
            }}
          >
            Find Your Perfect
            <br />
            <span style={{ color: 'var(--color-soft-terracotta)' }}>Travel Groups</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Connect with like-minded travelers, get personalized dining recommendations, and create unforgettable memories together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isSignedIn ? "/trips" : "/sign-up"}
              className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              {isSignedIn ? "🗺️ Browse Trips" : "🚀 Start Your Journey"}
            </Link>
            <Link
              href={isSignedIn ? "/create" : "/trips"}
              className="btn-secondary px-8 py-4 text-lg font-semibold rounded-xl hover:scale-105 transition-all"
            >
              {isSignedIn ? "✨ Create Trip" : "👀 Explore Trips"}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 md:py-24" style={{ background: 'var(--gradient-earthy)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ 
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                color: 'var(--color-warm-brown)' 
              }}
            >
              Why <span style={{ color: 'var(--color-soft-terracotta)' }}>TripSync</span>?
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Everything you need for the perfect group travel experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-featured p-8 flex flex-col items-center text-center hover:scale-105 transition-all">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 
                className="text-2xl font-semibold mb-4"
                style={{ 
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  color: 'var(--color-warm-brown)' 
                }}
              >
                Smart Matching
              </h3>
              <p className="leading-relaxed text-base" style={{ color: 'var(--text-secondary)' }}>
                Our algorithm matches you with compatible travelers based on lifestyle preferences, food choices, and travel style for harmonious adventures.
              </p>
            </div>

            <div className="card-featured p-8 flex flex-col items-center text-center hover:scale-105 transition-all">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                <Utensils className="w-10 h-10 text-white" />
              </div>
              <h3 
                className="text-2xl font-semibold mb-4"
                style={{ 
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  color: 'var(--color-warm-brown)' 
                }}
              >
                Dining Recommendations
              </h3>
              <p className="leading-relaxed text-base" style={{ color: 'var(--text-secondary)' }}>
                Get personalized restaurant suggestions for every meal based on your group's dietary requirements and cuisine preferences.
              </p>
            </div>

            <div className="card-featured p-8 flex flex-col items-center text-center hover:scale-105 transition-all">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 
                className="text-2xl font-semibold mb-4"
                style={{ 
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  color: 'var(--color-warm-brown)' 
                }}
              >
                Trusted Ratings
              </h3>
              <p className="leading-relaxed text-base" style={{ color: 'var(--text-secondary)' }}>
                Rate and review travel companions to build a trusted community of verified adventurers with transparent feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ 
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                color: 'var(--color-warm-brown)' 
              }}
            >
              How It <span style={{ color: 'var(--color-soft-terracotta)' }}>Works</span>
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Start your journey in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-white"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                1
              </div>
              <Sparkles className="w-12 h-12 mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
              <h3 
                className="text-xl font-semibold mb-3"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Set Your Preferences
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tell us about your lifestyle, dietary needs, and travel style to get matched with compatible companions.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-white"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                2
              </div>
              <Users className="w-12 h-12 mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
              <h3 
                className="text-xl font-semibold mb-3"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Join or Create Trips
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Browse existing trips or create your own adventure. Connect with travelers who share your interests.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-white"
                style={{ background: 'var(--gradient-adventure)' }}
              >
                3
              </div>
              <Calendar className="w-12 h-12 mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
              <h3 
                className="text-xl font-semibold mb-3"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Plan & Travel Together
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Use AI-powered itineraries, get dining recommendations, and chat with your group to plan the perfect trip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        className="w-full py-20 md:py-32 text-center relative overflow-hidden"
        style={{ background: 'var(--gradient-adventure)' }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif' }}
          >
            {isSignedIn ? "Continue Your" : "Ready to Start Your"} <br />Adventure?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            {isSignedIn 
              ? "Explore trips, set your preferences, and connect with fellow travelers around the world."
              : "Join thousands of travelers who have found their perfect companions through TripSync. Your next great adventure is just a click away."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isSignedIn && (
              <Link
                href="/sign-up"
                className="px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-lg"
                style={{ 
                  background: 'white',
                  color: 'var(--color-warm-brown)'
                }}
              >
                🚀 Get Started Free
              </Link>
            )}
            <Link
              href={isSignedIn ? "/trips" : "/preferences"}
              className="px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-lg border-2 border-white text-white hover:bg-white/10"
            >
              {isSignedIn ? "🗺️ Browse Trips" : "⚙️ Set Preferences"}
            </Link>
            {isSignedIn && (
              <Link
                href="/create"
                className="px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-lg"
                style={{ 
                  background: 'white',
                  color: 'var(--color-warm-brown)'
                }}
              >
                ✨ Create New Trip
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="w-full py-8 text-center border-t"
        style={{ 
          color: 'var(--text-tertiary)',
          borderColor: 'var(--color-light-gray)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p className="mb-2">
            &copy; {new Date().getFullYear()} TripSync. All rights reserved.
          </p>
          <p className="text-sm">
            Made with <span style={{ color: 'var(--color-soft-terracotta)' }}>❤️</span> for travelers around the world
          </p>
        </div>
      </footer>
    </div>
  );
}
