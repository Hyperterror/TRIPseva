import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripInvitation } from "@/models/TripInvitation";
import { TripRequest } from "@/models/TripRequest";
import { TripGroup } from "@/models/TripGroup";
import { User } from "@/models/userModel";
import { currentUser } from "@clerk/nextjs/server";

/**
 * GET /api/trips/:tripId/requests
 * Get all pending join requests for a trip (only for trip creator)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await connect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;

    // Verify user is the trip creator
    const trip = await TripRequest.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.userId !== user.id) {
      return NextResponse.json(
        { error: "Only trip creator can view requests" },
        { status: 403 }
      );
    }

    // Get all pending invitations for this trip
    const pendingRequests = await TripInvitation.find({
      tripId,
      status: "pending",
    }).sort({ createdAt: -1 });

    // Populate user details for each request
    const requestsWithUserInfo = await Promise.all(
      pendingRequests.map(async (req) => {
        const userInfo = await User.findOne({ userId: req.invitedUserId });
        return {
          _id: req._id,
          tripId: req.tripId,
          status: req.status,
          createdAt: req.createdAt,
          user: userInfo
            ? {
                userId: userInfo.userId,
                username: userInfo.username,
                name: userInfo.name,
                email: userInfo.email,
                profileImg: userInfo.profileImg,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      {
        requests: requestsWithUserInfo,
        total: requestsWithUserInfo.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/trips/:tripId/requests] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips/:tripId/requests
 * Accept or reject a join request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await connect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const body = await request.json();
    const { requestId, action } = body; // action: 'accept' or 'reject'

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify user is the trip creator
    const trip = await TripRequest.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.userId !== user.id) {
      return NextResponse.json(
        { error: "Only trip creator can manage requests" },
        { status: 403 }
      );
    }

    // Find the invitation
    const invitation = await TripInvitation.findById(requestId);
    if (!invitation) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (invitation.tripId.toString() !== tripId) {
      return NextResponse.json(
        { error: "Request does not belong to this trip" },
        { status: 400 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Update invitation status
    invitation.status = action === "accept" ? "accepted" : "rejected";
    await invitation.save();

    // If accepted, add user to trip group
    if (action === "accept") {
      const group = await TripGroup.findOne({ tripId });
      
      if (group) {
        // Check if user is already a member
        if (!group.members.includes(invitation.invitedUserId)) {
          group.members.push(invitation.invitedUserId);
          await group.save();
        }
      } else {
        // Create new group if it doesn't exist
        await TripGroup.create({
          tripId,
          members: [trip.userId, invitation.invitedUserId],
        });
      }
    }

    return NextResponse.json(
      {
        message: `Request ${action}ed successfully`,
        invitation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/trips/:tripId/requests] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
