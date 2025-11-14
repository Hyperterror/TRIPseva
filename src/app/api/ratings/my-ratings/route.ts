import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/userModel";
import { ratingService } from "@/services/RatingService";

/**
 * GET /api/ratings/my-ratings
 * Get all ratings given by the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    await connect();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get ratings given by this user
    const ratings = await ratingService.getRatingsGivenByUser(userId);

    // Populate rated user information
    const ratingsWithUserInfo = await Promise.all(
      ratings.map(async (rating) => {
        const ratedUser = await User.findOne({ userId: rating.ratedUserId });
        const ratingId = rating._id?.toString() || '';
        return {
          _id: rating._id,
          starRating: rating.starRating,
          feedback: rating.feedback,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
          tripGroup: rating.tripGroupId,
          ratedUser: ratedUser ? {
            userId: ratedUser.userId,
            name: ratedUser.name,
            profileImg: ratedUser.profileImg
          } : null,
          canEdit: await ratingService.canEditRating(ratingId, userId)
        };
      })
    );

    return NextResponse.json(
      {
        data: ratingsWithUserInfo,
        meta: {
          total: ratingsWithUserInfo.length,
          editable: ratingsWithUserInfo.filter(r => r.canEdit).length
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/ratings/my-ratings] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch your ratings" },
      { status: 500 }
    );
  }
}
