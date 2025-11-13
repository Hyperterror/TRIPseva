// app/layout.tsx (Server Component)
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/lib/navbar";

const inter = Inter({ 
  variable: "--font-inter", 
  subsets: ["latin"],
  display: 'swap',
});

const playfair = Playfair_Display({ 
  variable: "--font-playfair", 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TripSync - Find Your Perfect Travel Companion",
  description: "Connect with like-minded travelers, get personalized restaurant recommendations, and create unforgettable memories around the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full w-full" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${playfair.variable} ${inter.className} antialiased h-full w-full flex flex-col`}
          style={{ 
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
          suppressHydrationWarning
        >
          {/* Navbar */}
          <Navbar />

          {/* Main content */}
          <main className="flex-1 w-full">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
