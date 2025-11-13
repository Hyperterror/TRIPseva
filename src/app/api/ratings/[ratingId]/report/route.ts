import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ratingService } from "@/services/RatingService";
import mongoose from "mongoose";

/**
 * POST /api/ratings/:ratingId/report
 * Report a rating as inappropriate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { ratingId: string } }
) {
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

    const { ratingId } = params;

    // Validate ratingId format
    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return NextResponse.json(
        { error: "Invalid rating ID format" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Report reason is required" },
        { status: 400 }
      );
    }

    if (reason.trim().length > 500) {
      return NextResponse.json(
        { error: "Report reason cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Report the rating
    const updatedRating = await ratingService.reportRating(ratingId, reason.trim());

    if (!updatedRating) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    // Log the report for moderation
    console.log(`[RATING REPORT] Rating ${ratingId} reported by user ${userId}`);
    console.log(`[RATING REPORT] Reason: ${reason.trim()}`);
    console.log(`[RATING REPORT] Rated User: ${updatedRating.ratedUserId}, Rater: ${updatedRating.raterId}`);

    return NextResponse.json(
      {
        message: "Rating reported successfully. Our moderation team will review it.",
        data: {
          ratingId: updatedRating._id,
          isReported: updatedRating.isReported
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/ratings/:ratingId/report] Error:", error);
    return NextResponse.json(
      { error: "Failed to report rating" },
      { status: 500 }
    );
  }
}
