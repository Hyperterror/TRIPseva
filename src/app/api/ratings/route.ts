import { connect } from "@/db/dbconfig";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserRating } from "@/models/UserRating";
import { TripGroup } from "@/models/TripGroup";
import { ratingService } from "@/services/RatingService";
import { sanitizeFeedback } from "@/lib/sanitize";
import mongoose from "mongoose";

/**
 * POST /api/ratings
 * Submit a rating for another user after a trip
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { ratedUserId, tripGroupId, starRating, feedback } = body;

    // Validate required fields
    if (!ratedUserId || !tripGroupId || !starRating || !feedback) {
      return NextResponse.json(
        { error: "Missing required fields: ratedUserId, tripGroupId, starRating, feedback" },
        { status: 400 }
      );
    }

    // Check if user is rating themselves
    if (userId === ratedUserId) {
      return NextResponse.json(
        { error: "Cannot rate yourself" },
        { status: 400 }
      );
    }

    // Validate star rating
    const ratingValidation = ratingService.validateStarRating(starRating);
    if (!ratingValidation.valid) {
      return NextResponse.json(
        { error: ratingValidation.error },
        { status: 400 }
      );
    }

    // Sanitize and validate feedback
    const sanitizedFeedback = sanitizeFeedback(feedback, 500);
    const feedbackValidation = ratingService.validateFeedback(sanitizedFeedback);
    if (!feedbackValidation.valid) {
      return NextResponse.json(
        { error: feedbackValidation.error },
        { status: 400 }
      );
    }

    // Validate tripGroupId format
    if (!mongoose.Types.ObjectId.isValid(tripGroupId)) {
      return NextResponse.json(
        { error: "Invalid trip group ID format" },
        { status: 400 }
      );
    }

    // Verify trip exists and both users were members
    const tripGroup = await TripGroup.findById(tripGroupId);
    if (!tripGroup) {
      return NextResponse.json(
        { error: "Trip group not found" },
        { status: 404 }
      );
    }

    // Check if both users were part of the trip
    if (!tripGroup.members.includes(userId)) {
      return NextResponse.json(
        { error: "You were not part of this trip" },
        { status: 403 }
      );
    }

    if (!tripGroup.members.includes(ratedUserId)) {
      return NextResponse.json(
        { error: "The user you're trying to rate was not part of this trip" },
        { status: 403 }
      );
    }

    // Check for duplicate rating
    const hasRated = await ratingService.hasRatedUser(userId, ratedUserId, tripGroupId);
    if (hasRated) {
      return NextResponse.json(
        { 
          error: "You have already rated this user for this trip",
          message: "You can edit your existing rating instead"
        },
        { status: 409 }
      );
    }

    // Create rating with sanitized feedback
    const rating = await UserRating.create({
      raterId: userId,
      ratedUserId,
      tripGroupId: new mongoose.Types.ObjectId(tripGroupId),
      starRating,
      feedback: sanitizedFeedback,
      isReported: false
    });

    return NextResponse.json(
      {
        message: "Rating submitted successfully",
        data: rating
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/ratings] Error:", error);

    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json(
        { error: "You have already rated this user for this trip" },
        { status: 409 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}
