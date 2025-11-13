import { UserRating, IUserRating } from '../models/UserRating';

interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
}

export class RatingService {
  /**
   * Get rating summary for a user
   * Includes average rating, total count, and distribution
   */
  async getUserRatingSummary(userId: string): Promise<RatingSummary> {
    try {
      const ratings = await UserRating.find({ ratedUserId: userId });

      if (ratings.length === 0) {
        return {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      // Calculate average
      const sum = ratings.reduce((acc, r) => acc + r.starRating, 0);
      const averageRating = Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal

      // Calculate distribution
      const distribution = ratings.reduce((acc, r) => {
        acc[r.starRating] = (acc[r.starRating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Ensure all ratings 1-5 are present
      const ratingDistribution: Record<number, number> = {
        1: distribution[1] || 0,
        2: distribution[2] || 0,
        3: distribution[3] || 0,
        4: distribution[4] || 0,
        5: distribution[5] || 0
      };

      return {
        averageRating,
        totalRatings: ratings.length,
        ratingDistribution
      };
    } catch (error) {
      console.error('[RatingService] Error getting user rating summary:', error);
      throw error;
    }
  }

  /**
   * Check if a rating can be edited (within 7 days)
   */
  async canEditRating(ratingId: string, userId: string): Promise<boolean> {
    try {
      const rating = await UserRating.findById(ratingId);

      if (!rating) {
        return false;
      }

      // Check if user owns the rating
      if (rating.raterId !== userId) {
        return false;
      }

      // Check if within 7-day window
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return rating.createdAt > sevenDaysAgo;
    } catch (error) {
      console.error('[RatingService] Error checking edit permission:', error);
      return false;
    }
  }

  /**
   * Validate star rating
   */
  validateStarRating(rating: number): { valid: boolean; error?: string } {
    if (!Number.isInteger(rating)) {
      return { valid: false, error: 'Star rating must be an integer' };
    }

    if (rating < 1 || rating > 5) {
      return { valid: false, error: 'Star rating must be between 1 and 5' };
    }

    return { valid: true };
  }

  /**
   * Validate feedback text
   */
  validateFeedback(feedback: string): { valid: boolean; error?: string } {
    if (!feedback || typeof feedback !== 'string') {
      return { valid: false, error: 'Feedback is required' };
    }

    const trimmed = feedback.trim();

    if (trimmed.length < 20) {
      return { valid: false, error: 'Feedback must be at least 20 characters' };
    }

    if (trimmed.length > 500) {
      return { valid: false, error: 'Feedback cannot exceed 500 characters' };
    }

    return { valid: true };
  }

  /**
   * Check if user has already rated another user for a specific trip
   */
  async hasRatedUser(
    raterId: string,
    ratedUserId: string,
    tripGroupId: string
  ): Promise<boolean> {
    try {
      const existing = await UserRating.findOne({
        raterId,
        ratedUserId,
        tripGroupId
      });

      return !!existing;
    } catch (error) {
      console.error('[RatingService] Error checking existing rating:', error);
      return false;
    }
  }

  /**
   * Get ratings given by a user
   */
  async getRatingsGivenByUser(userId: string): Promise<IUserRating[]> {
    try {
      return await UserRating.find({ raterId: userId })
        .sort({ createdAt: -1 })
        .populate('tripGroupId', 'location dateFrom dateTo');
    } catch (error) {
      console.error('[RatingService] Error getting ratings given by user:', error);
      throw error;
    }
  }

  /**
   * Get ratings received by a user with pagination
   */
  async getRatingsReceivedByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ ratings: IUserRating[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      const [ratings, total] = await Promise.all([
        UserRating.find({ ratedUserId: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('tripGroupId', 'location dateFrom dateTo'),
        UserRating.countDocuments({ ratedUserId: userId })
      ]);

      return {
        ratings,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('[RatingService] Error getting ratings received by user:', error);
      throw error;
    }
  }

  /**
   * Report a rating as inappropriate
   */
  async reportRating(
    ratingId: string,
    reportReason: string
  ): Promise<IUserRating | null> {
    try {
      const rating = await UserRating.findByIdAndUpdate(
        ratingId,
        {
          isReported: true,
          reportReason
        },
        { new: true }
      );

      if (rating) {
        console.log(`[RatingService] Rating ${ratingId} reported: ${reportReason}`);
      }

      return rating;
    } catch (error) {
      console.error('[RatingService] Error reporting rating:', error);
      throw error;
    }
  }

  /**
   * Calculate percentage distribution of ratings
   */
  calculateRatingPercentages(distribution: Record<number, number>): Record<number, number> {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    return {
      1: Math.round((distribution[1] / total) * 100),
      2: Math.round((distribution[2] / total) * 100),
      3: Math.round((distribution[3] / total) * 100),
      4: Math.round((distribution[4] / total) * 100),
      5: Math.round((distribution[5] / total) * 100)
    };
  }
}

// Singleton instance
export const ratingService = new RatingService();
