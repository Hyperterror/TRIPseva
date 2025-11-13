"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import '../../../styles/design-system.css';

export default function VerifyEmailPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: otpCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await fetch("/api/createuser");
        router.push("/onboarding/preferences");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || "Invalid code.");
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
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'var(--color-warm-brown)' 
            }}
          >
            Verify Your Email
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            We've sent a verification code to your email
          </p>
        </div>

        {/* Verification Card */}
        <div className="card-featured p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="input-field w-full text-center text-2xl tracking-widest font-mono"
                required
              />
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Check your email inbox for the code
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded-lg text-sm flex items-center gap-2"
                style={{ 
                  background: 'rgba(183, 75, 75, 0.1)',
                  color: 'var(--status-error)',
                  border: '1px solid var(--status-error)'
                }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="btn-primary w-full py-3 font-semibold rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Verify Email
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Section */}
        <div 
          className="mt-8 p-6 rounded-lg text-center"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            📧 Didn't receive the code?
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email</li>
            <li>Wait a few minutes and check again</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="btn-tertiary mt-4 px-6 py-2 text-sm"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
