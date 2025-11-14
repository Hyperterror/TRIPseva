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

  // Validate and sanitize username
  const sanitizeUsername = (value: string) => {
    // Remove any characters that aren't letters, numbers, hyphens, or underscores
    return value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeUsername(e.target.value);
    setUsername(sanitized);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError(null);

    try {
      // Validate username format
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError("Username can only contain letters, numbers, hyphens (-), and underscores (_)");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError("Username must be at least 3 characters long");
        setLoading(false);
        return;
      }

      // Create sign-up
      const result = await signUp.create({
        emailAddress: email,
        password,
        username: username.toLowerCase(),
      });

      if (result.status === "complete") {
        // Set active session
        await setActive({ session: result.createdSessionId });
        
        // Wait for session to be fully set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Create user in database with timeout
        try {
          await Promise.race([
            axios.get("/api/createuser", { timeout: 10000 }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Database timeout")), 10000)
            )
          ]);
        } catch (dbError) {
          console.error("Failed to create user in database:", dbError);
          // Continue anyway - user exists in Clerk, can be created later
        }
        
        // Redirect to preferences onboarding
        router.push("/onboarding/preferences");
      } else if (result.status === "missing_requirements") {
        // Need email verification
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        router.push("/verify-email");
      } else {
        // Other status - try email verification
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          router.push("/verify-email");
        } catch (verifyErr) {
          console.error("Verification error:", verifyErr);
          setError("Unable to complete sign-up. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Sign-up error:", err);
      
      // Extract error message
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].longMessage || err.errors[0].message;
        
        // Handle specific error codes
        if (err.errors[0].code === "form_identifier_exists") {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (err.errors[0].code === "form_username_invalid") {
          errorMessage = "Username can only contain letters, numbers, hyphens (-), and underscores (_)";
        } else if (err.errors[0].code === "form_password_pwned") {
          errorMessage = "This password has been found in a data breach. Please choose a different password.";
        } else if (err.errors[0].code === "form_password_length_too_short") {
          errorMessage = "Password must be at least 8 characters long.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
                onChange={handleUsernameChange}
                required
                autoComplete="username"
                pattern="[a-zA-Z0-9_-]+"
                minLength={3}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Only letters, numbers, hyphens (-), and underscores (_)
              </p>
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
