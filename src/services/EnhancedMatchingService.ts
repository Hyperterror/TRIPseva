import { UserPreferences } from '../models/UserPreferences';
import { FoodPreferences } from '../models/FoodPreferences';
import { compatibilityService } from './CompatibilityService';

interface UserMatchData {
  userId: string;
  interests?: string[];
  budget?: { min: number; max: number };
  dates?: { from: Date; to: Date };
}

interface EnhancedCompatibilityResult {
  overallScore: number;
  breakdown: {
    interestMatch: number;
    budgetMatch: number;
    timeOverlap: number;
    lifestyleMatch: number;
    foodCompatibility: number;
    accommodationMatch: number;
  };
  matchReasons: string[];
  compatibilityLevel: 'high' | 'medium' | 'low';
}

/**
 * Enhanced Matching Service that includes lifestyle and food preferences
 * This extends the existing matching algorithm with new compatibility factors
 */
export class EnhancedMatchingService {
  /**
   * Calculate enhanced compatibility between two users
   * Includes existing factors (interests, budget, time) plus new factors (lifestyle, food, accommodation)
   */
  async calculateEnhancedCompatibility(
    user1: UserMatchData,
    user2: UserMatchData
  ): Promise<EnhancedCompatibilityResult> {
    // Fetch preferences for both users
    const [user1Lifestyle, user1Food, user2Lifestyle, user2Food] = await Promise.all([
      UserPreferences.findOne({ userId: user1.userId }),
      FoodPreferences.findOne({ userId: user1.userId }),
      UserPreferences.findOne({ userId: user2.userId }),
      FoodPreferences.findOne({ userId: user2.userId })
    ]);

    // Calculate existing compatibility factors
    const interestMatch = this.calculateInterestMatch(user1.interests, user2.interests);
    const budgetMatch = this.calculateBudgetMatch(user1.budget, user2.budget);
    const timeOverlap = this.calculateTimeOverlap(user1.dates, user2.dates);

    // Calculate new compatibility factors using CompatibilityService
    const compatibilityResult = compatibilityService.calculateCompatibility(
      { lifestyle: user1Lifestyle, food: user1Food },
      { lifestyle: user2Lifestyle, food: user2Food }
    );

    // Calculate overall weighted score
    const overallScore = 
      interestMatch * 0.25 +
      budgetMatch * 0.25 +
      timeOverlap * 0.25 +
      compatibilityResult.factors.lifestyleMatch * 0.10 +
      compatibilityResult.factors.foodCompatibility * 0.10 +
      compatibilityResult.factors.accommodationMatch * 0.05;

    return {
      overallScore,
      breakdown: {
        interestMatch,
        budgetMatch,
        timeOverlap,
        lifestyleMatch: compatibilityResult.factors.lifestyleMatch,
        foodCompatibility: compatibilityResult.factors.foodCompatibility,
        accommodationMatch: compatibilityResult.factors.accommodationMatch
      },
      matchReasons: compatibilityResult.matchReasons,
      compatibilityLevel: compatibilityService.getCompatibilityLevel(overallScore)
    };
  }

  /**
   * Calculate interest overlap between two users
   * Returns score 0-1
   */
  private calculateInterestMatch(
    interests1?: string[],
    interests2?: string[]
  ): number {
    if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
      return 0.5; // Neutral score if no interests
    }

    const overlap = interests1.filter(i => interests2.includes(i)).length;
    const maxInterests = Math.max(interests1.length, interests2.length);

    return overlap / maxInterests;
  }

  /**
   * Calculate budget compatibility
   * Returns score 0-1
   */
  private calculateBudgetMatch(
    budget1?: { min: number; max: number },
    budget2?: { min: number; max: number }
  ): number {
    if (!budget1 || !budget2) {
      return 0.5; // Neutral score if no budget
    }

    // Check for overlap
    const overlapMin = Math.max(budget1.min, budget2.min);
    const overlapMax = Math.min(budget1.max, budget2.max);

    if (overlapMin > overlapMax) {
      return 0; // No overlap
    }

    // Calculate overlap percentage
    const overlapRange = overlapMax - overlapMin;
    const totalRange = Math.max(budget1.max - budget1.min, budget2.max - budget2.min);

    return overlapRange / totalRange;
  }

  /**
   * Calculate time overlap between date ranges
   * Returns score 0-1
   */
  private calculateTimeOverlap(
    dates1?: { from: Date; to: Date },
    dates2?: { from: Date; to: Date }
  ): number {
    if (!dates1 || !dates2) {
      return 0.5; // Neutral score if no dates
    }

    const start1 = dates1.from.getTime();
    const end1 = dates1.to.getTime();
    const start2 = dates2.from.getTime();
    const end2 = dates2.to.getTime();

    // Check for overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    if (overlapStart > overlapEnd) {
      return 0; // No overlap
    }

    // Calculate overlap percentage
    const overlapDuration = overlapEnd - overlapStart;
    const totalDuration = Math.max(end1 - start1, end2 - start2);

    return overlapDuration / totalDuration;
  }

  /**
   * Generate match reason text for display
   */
  generateMatchReasonText(result: EnhancedCompatibilityResult): string {
    const reasons: string[] = [];

    // Add top compatibility factors
    if (result.breakdown.interestMatch > 0.7) {
      reasons.push('Shared interests');
    }
    if (result.breakdown.budgetMatch > 0.7) {
      reasons.push('Similar budget');
    }
    if (result.breakdown.timeOverlap > 0.7) {
      reasons.push('Overlapping dates');
    }

    // Add lifestyle/food reasons from CompatibilityService
    reasons.push(...result.matchReasons);

    // Return top 3 reasons
    return reasons.slice(0, 3).join(' • ');
  }

  /**
   * Filter users by minimum compatibility score
   */
  async filterByCompatibility(
    currentUser: UserMatchData,
    potentialMatches: UserMatchData[],
    minScore: number = 0.6
  ): Promise<Array<UserMatchData & { compatibilityScore: number; matchReasons: string }>> {
    const results = await Promise.all(
      potentialMatches.map(async (user) => {
        const compatibility = await this.calculateEnhancedCompatibility(currentUser, user);
        return {
          ...user,
          compatibilityScore: compatibility.overallScore,
          matchReasons: this.generateMatchReasonText(compatibility)
        };
      })
    );

    // Filter by minimum score and sort by score descending
    return results
      .filter(r => r.compatibilityScore >= minScore)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

// Singleton instance
export const enhancedMatchingService = new EnhancedMatchingService();
