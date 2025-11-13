"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Compass, MapPin, User, Settings, Plus, Home, Users } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import '../styles/design-system.css';

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Trips", href: "/trips", icon: MapPin },
    { name: "Open Groups", href: "/open-groups", icon: Users },
    { name: "Create", href: "/create", icon: Plus },
  ];

  const userLinks = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Preferences", href: "/preferences", icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="sticky top-0 z-50 border-b backdrop-blur-sm shadow-sm"
      style={{ 
        background: 'rgba(254, 249, 243, 0.95)',
        borderColor: 'var(--color-light-gray)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div 
              className="p-2 rounded-lg"
              style={{ background: 'var(--gradient-adventure)' }}
            >
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span 
              className="text-xl font-bold hidden sm:block"
              style={{ 
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                color: 'var(--color-warm-brown)' 
              }}
            >
              Trip<span style={{ color: 'var(--color-soft-terracotta)' }}>Sync</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    active ? 'btn-primary' : 'hover:bg-opacity-80'
                  }`}
                  style={!active ? { 
                    color: 'var(--text-secondary)',
                    background: 'transparent'
                  } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                {/* Desktop User Links */}
                <div className="hidden md:flex items-center gap-1">
                  {userLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          active ? 'btn-secondary' : 'hover:bg-opacity-80'
                        }`}
                        style={!active ? { 
                          color: 'var(--text-tertiary)',
                          background: 'transparent'
                        } : {}}
                      >
                        <Icon className="h-4 w-4" />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
                {/* User Button */}
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 rounded-full border-2",
                      userButtonPopoverCard: "shadow-lg",
                    }
                  }}
                />
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="btn-tertiary px-4 py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-primary px-4 py-2 text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-warm-brown)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden py-4 border-t animate-fade-in"
            style={{ borderColor: 'var(--color-light-gray)' }}
          >
            <div className="space-y-2">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      active ? 'btn-primary' : 'hover:bg-opacity-80'
                    }`}
                    style={!active ? { 
                      color: 'var(--text-secondary)',
                      background: 'transparent'
                    } : {}}
                  >
                    <Icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
              
              {isSignedIn && (
                <>
                  <div 
                    className="my-3 border-t"
                    style={{ borderColor: 'var(--color-light-gray)' }}
                  />
                  {userLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                          active ? 'btn-secondary' : 'hover:bg-opacity-80'
                        }`}
                        style={!active ? { 
                          color: 'var(--text-tertiary)',
                          background: 'transparent'
                        } : {}}
                      >
                        <Icon className="h-5 w-5" />
                        {link.name}
                      </Link>
                    );
                  })}
                </>
              )}

              {!isSignedIn && (
                <>
                  <div 
                    className="my-3 border-t"
                    style={{ borderColor: 'var(--color-light-gray)' }}
                  />
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-tertiary w-full px-4 py-3 text-left font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full px-4 py-3 text-left font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
