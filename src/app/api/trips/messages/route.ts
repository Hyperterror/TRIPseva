import { NextResponse } from "next/server";
import { connect } from "@/db/dbconfig";
import { TripMessage } from "@/models/Message";

// Connect to DB
connect();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripGroupId = searchParams.get("tripGroupId");

  if (!tripGroupId) {
    return NextResponse.json({ error: "Missing tripGroupId" }, { status: 400 });
  }

  try {
    const messages = await TripMessage.find({ tripGroupId }).sort({ createdAt: 1 });
    
    // Populate sender details
    const { User } = await import("@/models/userModel");
    const messagesWithSenderInfo = await Promise.all(
      messages.map(async (msg) => {
        const sender: any = await User.findOne({ userId: msg.senderId }).lean();
        return {
          _id: msg._id,
          tripGroupId: msg.tripGroupId,
          messageText: msg.messageText,
          createdAt: msg.createdAt,
          senderId: sender ? {
            userId: sender.userId,
            username: sender.username,
            name: sender.name,
            email: sender.email,
            profileImg: sender.profileImg,
          } : {
            userId: msg.senderId,
            name: "Unknown User",
          },
        };
      })
    );
    
    return NextResponse.json({ messages: messagesWithSenderInfo }, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { tripGroupId, senderId, messageText } = await req.json();

    if (!tripGroupId || !senderId || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = await TripMessage.create({
      tripGroupId,
      senderId,
      messageText,
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
