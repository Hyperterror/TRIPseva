/**
 * Search Index Manager Service
 * Manages user profile indexing for Azure AI Search integration
 */

import { azureSearchService, UserProfile } from './AzureSearchService';
import { UserPreferences, IUserPreferences } from '../models/UserPreferences';
import { FoodPreferences, IFoodPreferences } from '../models/FoodPreferences';
import { ErrorHandlingService } from './ErrorHandlingService';

export interface IndexingResult {
  success: boolean;
  userId: string;
  operation: 'index' | 'delete' | 'batch';
  error?: string;
}

export class SearchIndexManager {
  /**
   * Index user profile after preference updates
   */
  static async indexUserProfile(userId: string): Promise<IndexingResult> {
    try {
      const profile = await this.buildUserProfile(userId);

      if (!profile) {
        return {
          success: false,
          userId,
          operation: 'index',
          error: 'Incomplete user profile - missing preferences'
        };
      }

      await azureSearchService.indexUserProfile(profile);

      console.log(`[Search Index] Successfully indexed profile for user ${userId}`);
      return {
        success: true,
        userId,
        operation: 'index'
      };

    } catch (error) {
      ErrorHandlingService.logError(
        error as Error,
        { operation: 'indexUserProfile', userId }
      );

      return {
        success: false,
        userId,
        operation: 'index',
        error: (error as Error).message
      };
    }
  }

  /**
   * Remove user profile from search index
   */
  static async removeUserProfile(userId: string): Promise<IndexingResult> {
    try {
      await azureSearchService.deleteUserProfile(userId);

      console.log(`[Search Index] Successfully removed profile for user ${userId}`);
      return {
        success: true,
        userId,
        operation: 'delete'
      };

    } catch (error) {
      ErrorHandlingService.logError(
        error as Error,
        { operation: 'removeUserProfile', userId }
      );

      return {
        success: false,
        userId,
        operation: 'delete',
        error: (error as Error).message
      };
    }
  }

  /**
   * Batch index existing users
   */
  static async batchIndexExistingUsers(): Promise<{
    success: boolean;
    totalUsers: number;
    indexedUsers: number;
    errors: string[];
  }> {
    try {
      console.log('[Search Index] Starting batch indexing of existing users...');

      // Get all users with both lifestyle and food preferences
      const [lifestylePrefs, foodPrefs] = await Promise.all([
        UserPreferences.find({}).lean(),
        FoodPreferences.find({}).lean()
      ]);

      // Create a map of food preferences by userId for efficient lookup
      const foodPrefsMap = new Map<string, IFoodPreferences>();
      foodPrefs.forEach(pref => {
        foodPrefsMap.set(pref.userId, pref as any);
      });

      // Build profiles for users who have both lifestyle and food preferences
      const profiles: UserProfile[] = [];
      const errors: string[] = [];

      for (const lifestylePref of lifestylePrefs) {
        const foodPref = foodPrefsMap.get(lifestylePref.userId);

        if (foodPref) {
          try {
            const profile = this.createUserProfile(lifestylePref.userId, lifestylePref as unknown as IUserPreferences, foodPref as unknown as IFoodPreferences);
            profiles.push(profile);
          } catch (error) {
            errors.push(`Failed to build profile for user ${lifestylePref.userId}: ${error}`);
          }
        }
      }

      console.log(`[Search Index] Built ${profiles.length} profiles for batch indexing`);

      if (profiles.length > 0) {
        await azureSearchService.batchIndexProfiles(profiles);
      }

      console.log(`[Search Index] Batch indexing completed. Indexed ${profiles.length} users`);

      return {
        success: true,
        totalUsers: lifestylePrefs.length,
        indexedUsers: profiles.length,
        errors
      };

    } catch (error) {
      ErrorHandlingService.logError(
        error as Error,
        { operation: 'batchIndexExistingUsers' }
      );

      return {
        success: false,
        totalUsers: 0,
        indexedUsers: 0,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Build user profile from database preferences
   */
  private static async buildUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const [lifestylePrefs, foodPrefs] = await Promise.all([
        UserPreferences.findOne({ userId }).lean(),
        FoodPreferences.findOne({ userId }).lean()
      ]);

      if (!lifestylePrefs || !foodPrefs) {
        return null; // Need both preferences to create a complete profile
      }

      return this.createUserProfile(userId, lifestylePrefs as unknown as IUserPreferences, foodPrefs as unknown as IFoodPreferences);

    } catch (error) {
      console.error(`[Search Index] Error building profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create UserProfile object from preferences
   */
  private static createUserProfile(
    userId: string,
    lifestyle: IUserPreferences,
    food: IFoodPreferences
  ): UserProfile {
    // Derive interests from food preferences (simplified approach)
    const interests = [
      ...food.cuisinePreferences,
      ...food.mealTypePreferences
    ].filter(Boolean);

    // Derive travel style from lifestyle preferences
    const travelStyle = this.deriveTravelStyle(lifestyle);

    // Derive budget range from preferences
    const budgetRange = this.deriveBudgetRange(lifestyle, food);

    // Derive personality traits from lifestyle preferences
    const personality = this.derivePersonalityTraits(lifestyle);

    return {
      userId,
      interests,
      lifestyle,
      food,
      travelStyle,
      budgetRange,
      personality
    };
  }

  /**
   * Derive travel style from lifestyle preferences
   */
  private static deriveTravelStyle(lifestyle: IUserPreferences): string {
    if (lifestyle.activityLevel === 'high_energy') {
      return 'adventure';
    } else if (lifestyle.activityLevel === 'relaxed') {
      return 'leisure';
    } else if (lifestyle.accommodationPreference === 'luxury') {
      return 'luxury';
    } else if (lifestyle.accommodationPreference === 'budget') {
      return 'budget';
    } else {
      return 'balanced';
    }
  }

  /**
   * Derive budget range from preferences
   */
  private static deriveBudgetRange(lifestyle: IUserPreferences, food: IFoodPreferences): string {
    // Combine accommodation and food budget preferences
    if (lifestyle.accommodationPreference === 'luxury' || food.avgMealBudget === 'premium') {
      return 'high';
    } else if (lifestyle.accommodationPreference === 'budget' || food.avgMealBudget === 'budget') {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * Derive personality traits from lifestyle preferences
   */
  private static derivePersonalityTraits(lifestyle: IUserPreferences): string[] {
    const traits: string[] = [];

    if (lifestyle.activityLevel === 'high_energy') {
      traits.push('energetic', 'adventurous');
    } else if (lifestyle.activityLevel === 'relaxed') {
      traits.push('calm', 'laid-back');
    }

    if (lifestyle.sleepSchedule === 'early_riser') {
      traits.push('early-bird', 'organized');
    } else if (lifestyle.sleepSchedule === 'night_owl') {
      traits.push('night-owl', 'flexible');
    }

    if (lifestyle.budgetFlexibility === 'strict') {
      traits.push('budget-conscious', 'planner');
    } else if (lifestyle.budgetFlexibility === 'open_ended') {
      traits.push('spontaneous', 'flexible');
    }

    if (lifestyle.alcoholConsumption === 'teetotaler') {
      traits.push('health-conscious');
    } else if (lifestyle.alcoholConsumption === 'regular') {
      traits.push('social');
    }

    if (lifestyle.smoking === 'non_smoker') {
      traits.push('health-conscious');
    }

    return traits.length > 0 ? traits : ['balanced'];
  }

  /**
   * Check if user has complete profile for indexing
   */
  static async hasCompleteProfile(userId: string): Promise<boolean> {
    try {
      const [lifestylePrefs, foodPrefs] = await Promise.all([
        UserPreferences.findOne({ userId }).lean(),
        FoodPreferences.findOne({ userId }).lean()
      ]);

      return !!(lifestylePrefs && foodPrefs);
    } catch (error) {
      console.error(`[Search Index] Error checking profile completeness for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get indexing statistics
   */
  static async getIndexingStats(): Promise<{
    totalUsersWithPreferences: number;
    usersWithCompleteProfiles: number;
    indexingCoverage: number;
  }> {
    try {
      const [lifestyleCount, foodCount, completeProfiles] = await Promise.all([
        UserPreferences.countDocuments({}),
        FoodPreferences.countDocuments({}),
        this.getCompleteProfileCount()
      ]);

      const totalUsers = Math.max(lifestyleCount, foodCount);
      const coverage = totalUsers > 0 ? (completeProfiles / totalUsers) * 100 : 0;

      return {
        totalUsersWithPreferences: totalUsers,
        usersWithCompleteProfiles: completeProfiles,
        indexingCoverage: Math.round(coverage)
      };
    } catch (error) {
      console.error('[Search Index] Error getting indexing stats:', error);
      return {
        totalUsersWithPreferences: 0,
        usersWithCompleteProfiles: 0,
        indexingCoverage: 0
      };
    }
  }

  /**
   * Get count of users with complete profiles
   */
  private static async getCompleteProfileCount(): Promise<number> {
    try {
      const [lifestyleUsers, foodUsers] = await Promise.all([
        UserPreferences.distinct('userId'),
        FoodPreferences.distinct('userId')
      ]);

      // Find intersection of users who have both preferences
      const completeUsers = lifestyleUsers.filter(userId =>
        foodUsers.includes(userId)
      );

      return completeUsers.length;
    } catch (error) {
      console.error('[Search Index] Error counting complete profiles:', error);
      return 0;
    }
  }
}