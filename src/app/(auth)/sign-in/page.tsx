"use client";

import { SignIn } from "@clerk/nextjs";
import { Compass } from "lucide-react";
import '../../../styles/design-system.css';

export default function CustomSignInPage() {

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

        {/* Clerk Sign In Component */}
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "btn-secondary",
              formButtonPrimary: "btn-primary",
              footerActionLink: "text-[var(--color-soft-terracotta)] hover:underline",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
        />

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
