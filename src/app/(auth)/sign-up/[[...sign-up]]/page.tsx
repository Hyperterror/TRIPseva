"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { Compass, Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import '../../../../styles/design-system.css';

export default function CustomSignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        username,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        // Wait for session to be fully set
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create user in database
        try {
          await axios.get("/api/createuser");
        } catch (dbError) {
          console.error("Failed to create user in database:", dbError);
          // Continue anyway - user exists in Clerk
        }
        
        // Redirect to preferences onboarding
        router.push("/onboarding/preferences");
      } else {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        router.push("/verify-email");
      }
    } catch (err: any) {
      console.error("Sign-up error:", err);
      const errorMessage = err.errors?.[0]?.longMessage || 
                          err.errors?.[0]?.message || 
                          "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen py-12 px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="p-3 rounded-full"
              style={{ background: 'var(--gradient-adventure)' }}
            >
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'var(--color-warm-brown)' 
            }}
          >
            Join TripSync
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Start your journey with amazing travel companions
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="card-featured p-8">
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Username Field */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <User className="inline h-4 w-4 mr-1" />
                Username
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            {/* Email Field */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                className="input-field w-full"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Lock className="inline h-4 w-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Must be at least 8 characters
              </p>
            </div>

            {/* Fake CAPTCHA for Clerk */}
            <div id="clerk-captcha" style={{ display: "none" }} />

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: 'rgba(183, 75, 75, 0.1)',
                  color: 'var(--status-error)',
                  border: '1px solid var(--status-error)'
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-semibold rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Already have an account?{' '}
            <Link 
              href="/sign-in" 
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-soft-terracotta)' }}
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Benefits Section */}
        <div 
          className="mt-8 p-6 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <h3 
            className="font-semibold mb-3 text-center"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            🌟 What you'll get:
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Smart travel companion matching
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Personalized restaurant recommendations
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Trusted community ratings
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Easy group trip planning
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
