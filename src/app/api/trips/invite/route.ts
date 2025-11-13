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

    // Check if a pending or existing invitation already exists for this user
    const existingInvitation = await TripInvitation.findOne({
      tripId,
      invitedUserId: user.id,
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "You already have a pending or existing invitation for this trip" },
        { status: 400 }
      );
    }

    // Create new invitation
    const invitation = await TripInvitation.create({
      tripId,
      invitedUserId: user.id,
      invitedBy: user.id,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Invitation created successfully", invitation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating trip invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
