import { NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripRequest } from "@/models/TripRequest";

export async function GET(req: Request) {
  try {
    await connect();

    const url = new URL(req.url);
    const interestsParam = url.searchParams.get("interests");

    let filter: any = { status: "open" }; // always show only open trips

    // If user passes interests, filter trips by overlapping interests
    if (interestsParam) {
      const interests = interestsParam.split(",").map((i) => i.trim());
      filter.interests = { $in: interests };
    }

    const trips = await TripRequest.find(filter).lean();

    return NextResponse.json(trips, { status: 200 });
  } catch (error) {
    console.error("Trips GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
