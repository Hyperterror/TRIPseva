import { NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripRequest } from "@/models/TripRequest";
import { TripGroup } from "@/models/TripGroup";
import { TripInvitation } from "@/models/TripInvitation";
import { currentUser } from "@clerk/nextjs/server";

// TypeScript interfaces
interface TripGroupType {
  _id: string;
  members: string[];
  chatRoomId?: string;
}

interface TripRequestType {
  _id: string;
  location: string;
  date_from: Date;
  date_to: Date;
  interests: string[];
  group_size_pref: { min: number; max: number };
  status: string;
}

// POST handler to receive trip ID from frontend
export async function POST(req: Request) {
  try {
    await connect();

    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const tripId = body.id;
    if (!tripId) return NextResponse.json({ error: "Trip ID missing" }, { status: 400 });

    const trip: any = await TripRequest.findById(tripId).lean();
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    // Check if current user is the trip creator
    const isCreator = trip.userId === user.id;

    let group = (await TripGroup.findOne({ tripRequestIds: trip._id }).lean()) as TripGroupType | null;

    // Populate member details
    let populatedGroup = null;
    let isMember = false;
    
    if (group && group.members) {
      const memberIds = group.members.map((m: any) => m.toString());
      isMember = memberIds.includes(user.id);
      
      // Fetch user details for all members
      const { User } = await import("@/models/userModel");
      const memberDetails = await Promise.all(
        memberIds.map(async (memberId: string) => {
          const userDoc = await User.findOne({ userId: memberId }).lean();
          return userDoc || { userId: memberId, name: "Unknown User" };
        })
      );

      populatedGroup = {
        ...group,
        members: memberDetails,
      };
    }

    let invitation = null;
    if (!isMember && group) {
      invitation = await TripInvitation.findOne({
        tripGroupId: group._id,
        invitedUserId: user.id,
      }).lean();
    }

    return NextResponse.json({ 
      trip, 
      group: populatedGroup, 
      isMember, 
      invitation,
      isCreator,
      currentUserId: user.id
    }, { status: 200 });
  } catch (error) {
    console.error("Trip POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
