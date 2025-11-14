import { NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripInvitation } from "@/models/TripInvitation";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    await connect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID missing" }, { status: 400 });
    }

    // Check if user is already a member of the trip group
    const { TripGroup } = await import("@/models/TripGroup");
    const group = await TripGroup.findOne({ tripRequestIds: tripId });
    
    if (group && group.members) {
      const memberIds = group.members.map((m: any) => m.toString());
      if (memberIds.includes(user.id)) {
        return NextResponse.json(
          { error: "You are already a member of this trip" },
          { status: 400 }
        );
      }
    }

    // Check if a PENDING invitation already exists for this user
    const pendingInvitation = await TripInvitation.findOne({
      tripId,
      invitedUserId: user.id,
      status: "pending",
    });

    if (pendingInvitation) {
      return NextResponse.json(
        { error: "You already have a pending request for this trip" },
        { status: 400 }
      );
    }

    // Delete any old rejected/accepted invitations to allow re-requesting
    await TripInvitation.deleteMany({
      tripId,
      invitedUserId: user.id,
      status: { $in: ["accepted", "rejected"] },
    });

    // Create new invitation
    const invitation = await TripInvitation.create({
      tripId,
      invitedUserId: user.id,
      invitedBy: user.id,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Request sent successfully", invitation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating trip invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
