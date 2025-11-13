import { IUserPreferences } from '../models/UserPreferences';
import { IFoodPreferences } from '../models/FoodPreferences';

interface CompatibilityFactors {
  lifestyleMatch: number;
  foodCompatibility: number;
  accommodationMatch: number;
}

interface CompatibilityResult {
  score: number;
  factors: CompatibilityFactors;
  matchReasons: string[];
}

export class CompatibilityService {
  /**
   * Calculate overall compatibility between two users
   * Returns score (0-1) and breakdown of factors
   */
  calculateCompatibility(
    user1Prefs: { lifestyle: IUserPreferences | null; food: IFoodPreferences | null },
    user2Prefs: { lifestyle: IUserPreferences | null; food: IFoodPreferences | null }
  ): CompatibilityResult {
    const matchReasons: string[] = [];

    // Calculate individual factors
    const lifestyleMatch = this.calculateLifestyleMatch(
      user1Prefs.lifestyle,
      user2Prefs.lifestyle,
      matchReasons
    );

    const foodCompatibility = this.calculateFoodCompatibility(
      user1Prefs.food,
      user2Prefs.food,
      matchReasons
    );

    const accommodationMatch = this.calculateAccommodationMatch(
      user1Prefs.lifestyle,
      user2Prefs.lifestyle,
      matchReasons
    );

    const factors: CompatibilityFactors = {
      lifestyleMatch,
      foodCompatibility,
      accommodationMatch
    };

    // Calculate weighted score
    // Note: This is just the lifestyle/food/accommodation portion (25% of total)
    // The full compatibility score would include interest, budget, and time overlap
    const score = 
      lifestyleMatch * 0.10 +
      foodCompatibility * 0.10 +
      accommodationMatch * 0.05;

    return {
      score,
      factors,
      matchReasons
    };
  }

  /**
   * Calculate lifestyle compatibility
   * Factors: alcohol (50%), smoking (30%), activity level (20%)
   */
  private calculateLifestyleMatch(
    user1: IUserPreferences | null,
    user2: IUserPreferences | null,
    matchReasons: string[]
  ): number {
    if (!user1 || !user2) {
      return 0.5; // Neutral score if preferences not set
    }

    let score = 0;

    // Alcohol compatibility (50% of lifestyle score)
    if (user1.alcoholConsumption && user2.alcoholConsumption) {
      if (user1.alcoholConsumption === user2.alcoholConsumption) {
        score += 0.5;
        if (user1.alcoholConsumption !== 'no_preference') {
          matchReasons.push(`Both have ${user1.alcoholConsumption} alcohol preference`);
        }
      } else if (
        user1.alcoholConsumption === 'no_preference' ||
        user2.alcoholConsumption === 'no_preference'
      ) {
        score += 0.25;
      } else {
        // Conflicting preferences
        score += 0;
      }
    } else {
      score += 0.25; // Partial score if not set
    }

    // Smoking compatibility (30% of lifestyle score)
    if (user1.smoking && user2.smoking) {
      if (user1.smoking === user2.smoking) {
        score += 0.3;
        if (user1.smoking !== 'no_preference') {
          matchReasons.push(`Both are ${user1.smoking === 'non_smoker' ? 'non-smokers' : 'smokers'}`);
        }
      } else if (
        user1.smoking === 'no_preference' ||
        user2.smoking === 'no_preference'
      ) {
        score += 0.15;
      } else {
        // Conflicting preferences
        score += 0;
      }
    } else {
      score += 0.15; // Partial score if not set
    }

    // Activity level (20% of lifestyle score)
    if (user1.activityLevel && user2.activityLevel) {
      if (user1.activityLevel === user2.activityLevel) {
        score += 0.2;
        matchReasons.push(`Both prefer ${user1.activityLevel} activity level`);
      } else {
        score += 0.1; // Partial score for different activity levels
      }
    } else {
      score += 0.1; // Partial score if not set
    }

    return score;
  }

  /**
   * Calculate food compatibility
   * Based on dietary restrictions and cuisine preferences
   */
  private calculateFoodCompatibility(
    user1: IFoodPreferences | null,
    user2: IFoodPreferences | null,
    matchReasons: string[]
  ): number {
    if (!user1 || !user2) {
      return 0.5; // Neutral score if preferences not set
    }

    let score = 0;

    // Check for dietary conflicts (40% of food score)
    const hasConflict = this.hasDietaryConflict(
      user1.dietaryRestrictions,
      user2.dietaryRestrictions
    );

    if (hasConflict) {
      score += 0.15; // Low score for conflicts
    } else {
      score += 0.4;
      
      // Check for matching dietary restrictions
      const commonRestrictions = user1.dietaryRestrictions.filter(r =>
        user2.dietaryRestrictions.includes(r)
      );
      if (commonRestrictions.length > 0) {
        matchReasons.push(`Both have ${commonRestrictions.join(', ')} dietary preferences`);
      }
    }

    // Calculate cuisine overlap (60% of food score)
    if (user1.cuisinePreferences.length > 0 && user2.cuisinePreferences.length > 0) {
      const overlap = user1.cuisinePreferences.filter(c =>
        user2.cuisinePreferences.includes(c)
      ).length;

      const maxCuisines = Math.max(
        user1.cuisinePreferences.length,
        user2.cuisinePreferences.length
      );

      const cuisineScore = overlap / maxCuisines;
      score += cuisineScore * 0.6;

      if (overlap > 0) {
        const commonCuisines = user1.cuisinePreferences.filter(c =>
          user2.cuisinePreferences.includes(c)
        );
        matchReasons.push(`Share ${overlap} cuisine preference${overlap > 1 ? 's' : ''}`);
      }
    } else {
      score += 0.3; // Partial score if cuisines not set
    }

    return score;
  }

  /**
   * Check for major dietary conflicts
   */
  private hasDietaryConflict(
    restrictions1: string[],
    restrictions2: string[]
  ): boolean {
    // Check for vegan vs non-veg conflict
    const isVegan1 = restrictions1.includes('vegan');
    const isNonVeg2 = restrictions2.includes('non_veg') && 
                      !restrictions2.includes('vegetarian') && 
                      !restrictions2.includes('vegan');

    const isVegan2 = restrictions2.includes('vegan');
    const isNonVeg1 = restrictions1.includes('non_veg') && 
                      !restrictions1.includes('vegetarian') && 
                      !restrictions1.includes('vegan');

    return (isVegan1 && isNonVeg2) || (isVegan2 && isNonVeg1);
  }

  /**
   * Calculate accommodation preference match
   */
  private calculateAccommodationMatch(
    user1: IUserPreferences | null,
    user2: IUserPreferences | null,
    matchReasons: string[]
  ): number {
    if (!user1 || !user2) {
      return 0.5; // Neutral score if preferences not set
    }

    if (user1.accommodationPreference && user2.accommodationPreference) {
      if (user1.accommodationPreference === user2.accommodationPreference) {
        matchReasons.push(`Both prefer ${user1.accommodationPreference} accommodation`);
        return 1.0;
      }
      return 0.5; // Different preferences but not a deal-breaker
    }

    return 0.5; // Neutral if not set
  }

  /**
   * Generate match reason text from compatibility factors
   */
  generateMatchReasonText(result: CompatibilityResult): string {
    if (result.matchReasons.length === 0) {
      return 'Compatible travel preferences';
    }

    return result.matchReasons.slice(0, 3).join(' • ');
  }

  /**
   * Get compatibility level label
   */
  getCompatibilityLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Get compatibility color for UI
   */
  getCompatibilityColor(score: number): string {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  }
}

// Singleton instance
export const compatibilityService = new CompatibilityService();
