import { NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripRequest } from "@/models/TripRequest";
import { TripGroup } from "@/models/TripGroup";
import { currentUser } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid"; // generate unique group IDs

export async function POST(req: Request) {
  try {
    await connect();

    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      location,
      date_from,
      date_to,
      interests,
      group_size_min,
      group_size_max,
    } = body;

    if (!location || !date_from || !date_to || !interests || !group_size_min || !group_size_max) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Create TripRequest
    const newTrip = await TripRequest.create({
      userId: user.id,
      location,
      date_from: new Date(date_from),
      date_to: new Date(date_to),
      interests,
      group_size_pref: { min: Number(group_size_min), max: Number(group_size_max) },
      status: "open",
    });

    // 2️⃣ Create TripGroup with a unique groupId
    const newGroup = await TripGroup.create({
      groupId: uuidv4(), // ✅ Always unique
      tripRequestIds: [newTrip._id],
      members: [user.id],
      location,
      dateFrom: new Date(date_from),
      dateTo: new Date(date_to),
    });

    return NextResponse.json({ trip: newTrip, group: newGroup }, { status: 201 });

  } catch (error: any) {
    console.error("Trip POST error:", error);

    // Handle duplicate key just in case
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate group detected. Try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
