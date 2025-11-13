/**
 * Validation Utility for Preferences and Ratings
 * Centralized validation logic for user inputs
 */

// Valid enum values for preferences
export const VALID_ALCOHOL_VALUES = ['teetotaler', 'occasional', 'regular', 'no_preference', null] as const;
export const VALID_SMOKING_VALUES = ['non_smoker', 'smoker', 'no_preference', null] as const;
export const VALID_ACTIVITY_VALUES = ['relaxed', 'moderate', 'high_energy', null] as const;
export const VALID_SLEEP_VALUES = ['early_riser', 'night_owl', 'flexible', null] as const;
export const VALID_BUDGET_FLEXIBILITY_VALUES = ['strict', 'flexible', 'open_ended', null] as const;
export const VALID_ACCOMMODATION_VALUES = ['budget', 'mid_range', 'luxury', null] as const;
export const VALID_MEAL_BUDGET_VALUES = ['budget', 'moderate', 'premium', null] as const;

// Common dietary restrictions
export const COMMON_DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'non_veg',
  'halal',
  'kosher',
  'no_restrictions'
] as const;

// Common cuisines
export const COMMON_CUISINES = [
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Thai',
  'Japanese',
  'Korean',
  'Vietnamese',
  'French',
  'Mediterranean',
  'Greek',
  'Spanish',
  'American',
  'Brazilian',
  'Turkish',
  'Lebanese',
  'Middle Eastern',
  'Seafood',
  'Vegetarian',
  'Vegan'
] as const;

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate lifestyle preference value
 */
export function validateLifestylePreference(
  field: string,
  value: any,
  validValues: readonly any[]
): ValidationResult {
  if (value === undefined) {
    return { valid: true }; // Optional field
  }

  if (!validValues.includes(value)) {
    return {
      valid: false,
      error: `Invalid ${field} value. Must be one of: ${validValues.filter(v => v !== null).join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate dietary restrictions array
 */
export function validateDietaryRestrictions(restrictions: any): ValidationResult {
  if (!restrictions) {
    return { valid: true }; // Optional
  }

  if (!Array.isArray(restrictions)) {
    return {
      valid: false,
      error: 'Dietary restrictions must be an array'
    };
  }

  // Check for invalid values
  const invalidItems = restrictions.filter(
    item => typeof item !== 'string' || item.trim().length === 0
  );

  if (invalidItems.length > 0) {
    return {
      valid: false,
      error: 'All dietary restrictions must be non-empty strings'
    };
  }

  return { valid: true };
}

/**
 * Validate cuisine preferences array
 */
export function validateCuisinePreferences(cuisines: any): ValidationResult {
  if (!cuisines) {
    return { valid: true }; // Optional
  }

  if (!Array.isArray(cuisines)) {
    return {
      valid: false,
      error: 'Cuisine preferences must be an array'
    };
  }

  // Check for invalid values
  const invalidItems = cuisines.filter(
    item => typeof item !== 'string' || item.trim().length === 0
  );

  if (invalidItems.length > 0) {
    return {
      valid: false,
      error: 'All cuisine preferences must be non-empty strings'
    };
  }

  return { valid: true };
}

/**
 * Validate allergies text
 */
export function validateAllergies(allergies: any): ValidationResult {
  if (!allergies) {
    return { valid: true }; // Optional
  }

  if (typeof allergies !== 'string') {
    return {
      valid: false,
      error: 'Allergies must be a string'
    };
  }

  if (allergies.length > 500) {
    return {
      valid: false,
      error: 'Allergies description cannot exceed 500 characters'
    };
  }

  return { valid: true };
}

/**
 * Validate star rating (1-5, integer)
 */
export function validateStarRating(rating: any): ValidationResult {
  if (rating === undefined || rating === null) {
    return {
      valid: false,
      error: 'Star rating is required'
    };
  }

  if (typeof rating !== 'number') {
    return {
      valid: false,
      error: 'Star rating must be a number'
    };
  }

  if (!Number.isInteger(rating)) {
    return {
      valid: false,
      error: 'Star rating must be an integer'
    };
  }

  if (rating < 1 || rating > 5) {
    return {
      valid: false,
      error: 'Star rating must be between 1 and 5'
    };
  }

  return { valid: true };
}

/**
 * Validate feedback text (20-500 characters)
 */
export function validateFeedback(feedback: any): ValidationResult {
  if (!feedback) {
    return {
      valid: false,
      error: 'Feedback is required'
    };
  }

  if (typeof feedback !== 'string') {
    return {
      valid: false,
      error: 'Feedback must be a string'
    };
  }

  const trimmed = feedback.trim();

  if (trimmed.length < 20) {
    return {
      valid: false,
      error: 'Feedback must be at least 20 characters'
    };
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      error: 'Feedback cannot exceed 500 characters'
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: any): ValidationResult {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email must be a string'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  return { valid: true };
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id: any): ValidationResult {
  if (!id) {
    return {
      valid: false,
      error: 'ID is required'
    };
  }

  if (typeof id !== 'string') {
    return {
      valid: false,
      error: 'ID must be a string'
    };
  }

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    return {
      valid: false,
      error: 'Invalid ID format'
    };
  }

  return { valid: true };
}

/**
 * Validate latitude
 */
export function validateLatitude(lat: any): ValidationResult {
  if (lat === undefined || lat === null) {
    return {
      valid: false,
      error: 'Latitude is required'
    };
  }

  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;

  if (isNaN(latitude)) {
    return {
      valid: false,
      error: 'Latitude must be a valid number'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90'
    };
  }

  return { valid: true };
}

/**
 * Validate longitude
 */
export function validateLongitude(lng: any): ValidationResult {
  if (lng === undefined || lng === null) {
    return {
      valid: false,
      error: 'Longitude is required'
    };
  }

  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

  if (isNaN(longitude)) {
    return {
      valid: false,
      error: 'Longitude must be a valid number'
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180'
    };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: any, limit: any): ValidationResult {
  const pageNum = typeof page === 'string' ? parseInt(page) : page;
  const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;

  if (isNaN(pageNum) || pageNum < 1) {
    return {
      valid: false,
      error: 'Page must be a positive integer'
    };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return {
      valid: false,
      error: 'Limit must be between 1 and 100'
    };
  }

  return { valid: true };
}

/**
 * Sanitize string input (basic sanitization)
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize user input object
 */
export function validateAndSanitizeInput<T extends Record<string, any>>(
  input: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { valid: boolean; errors: string[]; sanitized: Partial<T> } {
  const errors: string[] = [];
  const sanitized: Partial<T> = {};

  for (const [key, validator] of Object.entries(validators)) {
    const value = input[key as keyof T];
    const result = validator(value);

    if (!result.valid && result.error) {
      errors.push(`${key}: ${result.error}`);
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}
