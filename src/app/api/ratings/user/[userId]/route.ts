import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/userModel";
import { ratingService } from "@/services/RatingService";

/**
 * GET /api/ratings/user/:userId
 * Get all ratings for a specific user with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connect();

    // Authentication check
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Verify user exists
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit between 1-100" },
        { status: 400 }
      );
    }

    // Get ratings with pagination
    const { ratings, total, totalPages } = await ratingService.getRatingsReceivedByUser(
      userId,
      page,
      limit
    );

    // Get rating summary
    const summary = await ratingService.getUserRatingSummary(userId);

    // Populate rater information
    const ratingsWithRaterInfo = await Promise.all(
      ratings.map(async (rating) => {
        const rater = await User.findOne({ userId: rating.raterId });
        return {
          _id: rating._id,
          starRating: rating.starRating,
          feedback: rating.feedback,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
          isReported: rating.isReported,
          tripGroup: rating.tripGroupId,
          rater: rater ? {
            userId: rater.userId,
            name: rater.name,
            profileImg: rater.profileImg
          } : null
        };
      })
    );

    return NextResponse.json(
      {
        data: ratingsWithRaterInfo,
        summary: {
          averageRating: summary.averageRating,
          totalRatings: summary.totalRatings,
          ratingDistribution: summary.ratingDistribution,
          ratingPercentages: ratingService.calculateRatingPercentages(summary.ratingDistribution)
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/ratings/user/:userId] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user ratings" },
      { status: 500 }
    );
  }
}
