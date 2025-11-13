import mongoose from "mongoose";

const TripInvitationSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "TripRequest", required: true },
    invitedUserId: { type: String, required: true },
    invitedBy: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const TripInvitation =
  mongoose.models.TripInvitation ||
  mongoose.model("TripInvitation", TripInvitationSchema);
