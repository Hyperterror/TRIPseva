/**
 * Cuisine Mapping Utility
 * Maps Google Places types to user-friendly cuisine categories
 */

// Bidirectional mapping between Google Places types and cuisine names
export const CUISINE_MAPPING: Record<string, string> = {
  // Restaurant types from Google Places
  'italian_restaurant': 'Italian',
  'chinese_restaurant': 'Chinese',
  'indian_restaurant': 'Indian',
  'mexican_restaurant': 'Mexican',
  'thai_restaurant': 'Thai',
  'japanese_restaurant': 'Japanese',
  'korean_restaurant': 'Korean',
  'vietnamese_restaurant': 'Vietnamese',
  'french_restaurant': 'French',
  'mediterranean_restaurant': 'Mediterranean',
  'greek_restaurant': 'Greek',
  'spanish_restaurant': 'Spanish',
  'american_restaurant': 'American',
  'brazilian_restaurant': 'Brazilian',
  'turkish_restaurant': 'Turkish',
  'lebanese_restaurant': 'Lebanese',
  'middle_eastern_restaurant': 'Middle Eastern',
  
  // Food types
  'pizza': 'Italian',
  'sushi': 'Japanese',
  'ramen': 'Japanese',
  'burger': 'American',
  'barbecue': 'American',
  'steak_house': 'American',
  'seafood_restaurant': 'Seafood',
  'vegetarian_restaurant': 'Vegetarian',
  'vegan_restaurant': 'Vegan',
  
  // Meal types
  'cafe': 'Café',
  'bakery': 'Bakery',
  'fast_food': 'Fast Food',
  'fine_dining': 'Fine Dining',
  'casual_dining': 'Casual'
};

// Reverse mapping: cuisine name to Google Places types
export const REVERSE_CUISINE_MAPPING: Record<string, string[]> = {
  'Italian': ['italian_restaurant', 'pizza'],
  'Chinese': ['chinese_restaurant'],
  'Indian': ['indian_restaurant'],
  'Mexican': ['mexican_restaurant'],
  'Thai': ['thai_restaurant'],
  'Japanese': ['japanese_restaurant', 'sushi', 'ramen'],
  'Korean': ['korean_restaurant'],
  'Vietnamese': ['vietnamese_restaurant'],
  'French': ['french_restaurant'],
  'Mediterranean': ['mediterranean_restaurant', 'greek_restaurant'],
  'Greek': ['greek_restaurant'],
  'Spanish': ['spanish_restaurant'],
  'American': ['american_restaurant', 'burger', 'barbecue', 'steak_house'],
  'Brazilian': ['brazilian_restaurant'],
  'Turkish': ['turkish_restaurant'],
  'Lebanese': ['lebanese_restaurant'],
  'Middle Eastern': ['middle_eastern_restaurant', 'lebanese_restaurant'],
  'Seafood': ['seafood_restaurant'],
  'Vegetarian': ['vegetarian_restaurant'],
  'Vegan': ['vegan_restaurant'],
  'Café': ['cafe'],
  'Bakery': ['bakery'],
  'Fast Food': ['fast_food'],
  'Fine Dining': ['fine_dining'],
  'Casual': ['casual_dining']
};

// List of all supported cuisines for UI
export const SUPPORTED_CUISINES = Object.keys(REVERSE_CUISINE_MAPPING).sort();

// Dietary restriction keywords
export const DIETARY_KEYWORDS: Record<string, string[]> = {
  'vegetarian': ['vegetarian', 'veg', 'plant-based'],
  'vegan': ['vegan', 'plant-based'],
  'gluten_free': ['gluten-free', 'gluten free', 'celiac'],
  'halal': ['halal'],
  'kosher': ['kosher'],
  'dairy_free': ['dairy-free', 'lactose-free']
};

/**
 * Extract cuisine types from Google Places restaurant data
 * @param restaurant - Restaurant object from Google Places API
 * @returns Array of cuisine names
 */
export function extractCuisines(restaurant: any): string[] {
  const types = restaurant.types || [];
  const cuisines: string[] = [];
  const seen = new Set<string>();

  // Map Google Places types to cuisine names
  types.forEach((type: string) => {
    const cuisine = CUISINE_MAPPING[type];
    if (cuisine && !seen.has(cuisine)) {
      cuisines.push(cuisine);
      seen.add(cuisine);
    }
  });

  // Also check name for cuisine keywords
  if (restaurant.name) {
    const nameLower = restaurant.name.toLowerCase();
    Object.entries(CUISINE_MAPPING).forEach(([type, cuisine]) => {
      if (nameLower.includes(type.replace('_restaurant', '').replace('_', ' ')) && !seen.has(cuisine)) {
        cuisines.push(cuisine);
        seen.add(cuisine);
      }
    });
  }

  return cuisines;
}

/**
 * Get Google Places types for a cuisine preference
 * @param cuisine - Cuisine name (e.g., 'Italian')
 * @returns Array of Google Places types
 */
export function getPlacesTypesForCuisine(cuisine: string): string[] {
  return REVERSE_CUISINE_MAPPING[cuisine] || [];
}

/**
 * Check if restaurant matches dietary restrictions
 * @param restaurant - Restaurant object from Google Places API
 * @param restrictions - Array of dietary restrictions
 * @returns Boolean indicating if restaurant matches
 */
export function matchesDietaryRestrictions(
  restaurant: any,
  restrictions: string[]
): boolean {
  if (!restrictions || restrictions.length === 0) {
    return true; // No restrictions
  }

  const types = restaurant.types || [];
  const name = restaurant.name?.toLowerCase() || '';
  const description = restaurant.description?.toLowerCase() || '';

  // Check each restriction
  for (const restriction of restrictions) {
    const keywords = DIETARY_KEYWORDS[restriction] || [restriction];
    
    // Check if any keyword matches
    const hasMatch = keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return (
        types.some((t: string) => t.includes(keywordLower)) ||
        name.includes(keywordLower) ||
        description.includes(keywordLower)
      );
    });

    // For vegetarian/vegan, also check cuisine types
    if (restriction === 'vegetarian' || restriction === 'vegan') {
      const cuisines = extractCuisines(restaurant);
      const hasVegCuisine = cuisines.some(c => 
        ['Vegetarian', 'Vegan', 'Indian', 'Mediterranean'].includes(c)
      );
      if (hasVegCuisine) {
        return true;
      }
    }

    if (!hasMatch && (restriction === 'vegetarian' || restriction === 'vegan')) {
      return false; // Strict filtering for veg/vegan
    }
  }

  return true;
}

/**
 * Calculate cuisine match score
 * @param restaurantCuisines - Cuisines of the restaurant
 * @param userCuisines - User's preferred cuisines
 * @returns Score between 0 and 1
 */
export function calculateCuisineMatchScore(
  restaurantCuisines: string[],
  userCuisines: string[]
): number {
  if (!userCuisines || userCuisines.length === 0) {
    return 0.5; // Neutral score if no preferences
  }

  if (!restaurantCuisines || restaurantCuisines.length === 0) {
    return 0.3; // Low score if restaurant has no cuisine data
  }

  // Count overlapping cuisines
  const overlap = restaurantCuisines.filter(c =>
    userCuisines.some(uc => uc.toLowerCase() === c.toLowerCase())
  ).length;

  // Calculate score based on overlap
  return Math.min(overlap / userCuisines.length, 1.0);
}

/**
 * Get cuisine icon/emoji for display
 * @param cuisine - Cuisine name
 * @returns Emoji representing the cuisine
 */
export function getCuisineIcon(cuisine: string): string {
  const icons: Record<string, string> = {
    'Italian': '🍝',
    'Chinese': '🥡',
    'Indian': '🍛',
    'Mexican': '🌮',
    'Thai': '🍜',
    'Japanese': '🍣',
    'Korean': '🍲',
    'Vietnamese': '🍜',
    'French': '🥐',
    'Mediterranean': '🥗',
    'Greek': '🥙',
    'American': '🍔',
    'Seafood': '🦞',
    'Vegetarian': '🥬',
    'Vegan': '🌱',
    'Café': '☕',
    'Bakery': '🥖',
    'Fast Food': '🍟'
  };

  return icons[cuisine] || '🍽️';
}

/**
 * Format cuisine list for display
 * @param cuisines - Array of cuisine names
 * @param maxDisplay - Maximum number to display
 * @returns Formatted string
 */
export function formatCuisineList(cuisines: string[], maxDisplay: number = 3): string {
  if (cuisines.length === 0) {
    return 'Various cuisines';
  }

  if (cuisines.length <= maxDisplay) {
    return cuisines.join(', ');
  }

  const displayed = cuisines.slice(0, maxDisplay);
  const remaining = cuisines.length - maxDisplay;
  return `${displayed.join(', ')} +${remaining} more`;
}
