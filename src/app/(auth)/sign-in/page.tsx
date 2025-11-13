"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Compass, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import '../../../styles/design-system.css';

export default function CustomSignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        console.log("Incomplete sign-in:", result);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || "Invalid credentials.");
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
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'var(--color-warm-brown)' 
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Sign in to continue your travel journey
          </p>
        </div>

        {/* Sign In Card */}
        <div className="card-featured p-8">
          <form onSubmit={handleSignIn} className="space-y-6">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            New to TripSync?{' '}
            <Link 
              href="/sign-up" 
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-soft-terracotta)' }}
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div 
          className="mt-8 p-6 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <h3 
            className="font-semibold mb-3 text-center"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            🌟 Continue Your Adventure
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Access your trips and travel plans
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Connect with your travel companions
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              Get personalized recommendations
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
