import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserRating } from "@/models/UserRating";
import { ratingService } from "@/services/RatingService";
import mongoose from "mongoose";

/**
 * PUT /api/ratings/:ratingId
 * Update an existing rating (within 7 days)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ratingId: string }> }
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

    const { ratingId } = await params;

    // Validate ratingId format
    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return NextResponse.json(
        { error: "Invalid rating ID format" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { starRating, feedback } = body;

    // At least one field must be provided
    if (starRating === undefined && feedback === undefined) {
      return NextResponse.json(
        { error: "At least one field (starRating or feedback) must be provided" },
        { status: 400 }
      );
    }

    // Fetch the rating
    const rating = await UserRating.findById(ratingId);
    if (!rating) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    // Verify user owns the rating
    if (rating.raterId !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own ratings" },
        { status: 403 }
      );
    }

    // Check if within 7-day edit window
    const canEdit = await ratingService.canEditRating(ratingId, userId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Rating can only be edited within 7 days of submission" },
        { status: 403 }
      );
    }

    // Validate star rating if provided
    if (starRating !== undefined) {
      const ratingValidation = ratingService.validateStarRating(starRating);
      if (!ratingValidation.valid) {
        return NextResponse.json(
          { error: ratingValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate feedback if provided
    if (feedback !== undefined) {
      const feedbackValidation = ratingService.validateFeedback(feedback);
      if (!feedbackValidation.valid) {
        return NextResponse.json(
          { error: feedbackValidation.error },
          { status: 400 }
        );
      }
    }

    // Update rating
    const updateData: any = {};
    if (starRating !== undefined) updateData.starRating = starRating;
    if (feedback !== undefined) updateData.feedback = feedback.trim();

    const updatedRating = await UserRating.findByIdAndUpdate(
      ratingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "Rating updated successfully",
        data: updatedRating
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PUT /api/ratings/:ratingId] Error:", error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update rating" },
      { status: 500 }
    );
  }
}
