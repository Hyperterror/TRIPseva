/**
 * Google Places API Configuration
 * Centralized configuration for restaurant recommendations
 */

export const GOOGLE_PLACES_CONFIG = {
  // API Configuration
  apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  baseUrl: 'https://maps.googleapis.com/maps/api/place',
  
  // Search Parameters
  defaultRadius: 2000, // 2km in meters
  minRating: 3.5,
  resultsPerMeal: 5,
  
  // Request Configuration
  requestTimeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay for exponential backoff
  
  // Cache Configuration
  cacheTTL: 86400, // 24 hours in seconds
  
  // Rate Limiting
  maxRequestsPerMinute: 100,
  
  // Meal Types
  mealTypes: ['breakfast', 'lunch', 'dinner'] as const,
  
  // Price Levels (Google Places uses 0-4, we use 1-4)
  priceLevels: {
    budget: [1, 2],
    moderate: [2, 3],
    premium: [3, 4]
  }
} as const;

/**
 * Validate Google Places API configuration
 */
export function validateGooglePlacesConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!GOOGLE_PLACES_CONFIG.apiKey) {
    errors.push('GOOGLE_PLACES_API_KEY environment variable is not set');
  }

  if (GOOGLE_PLACES_CONFIG.defaultRadius < 100 || GOOGLE_PLACES_CONFIG.defaultRadius > 50000) {
    errors.push('Default radius must be between 100 and 50000 meters');
  }

  if (GOOGLE_PLACES_CONFIG.minRating < 0 || GOOGLE_PLACES_CONFIG.minRating > 5) {
    errors.push('Minimum rating must be between 0 and 5');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get price level range for budget preference
 */
export function getPriceLevelForBudget(budget: 'budget' | 'moderate' | 'premium' | null): number[] {
  if (!budget) {
    return [1, 2, 3, 4]; // All price levels
  }
  return [...GOOGLE_PLACES_CONFIG.priceLevels[budget]];
}

/**
 * Check if API is configured
 */
export function isGooglePlacesConfigured(): boolean {
  return !!GOOGLE_PLACES_CONFIG.apiKey && GOOGLE_PLACES_CONFIG.apiKey.length > 0;
}

// Log configuration status on module load
if (typeof window === 'undefined') { // Server-side only
  const validation = validateGooglePlacesConfig();
  if (!validation.valid) {
    console.warn('[Google Places Config] Configuration issues:', validation.errors);
  } else {
    console.log('[Google Places Config] Configuration valid');
  }
}
