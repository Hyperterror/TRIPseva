import {User} from "@/models/userModel"
import mongoose, { Schema, Document } from "mongoose";

export interface ITripMessage extends Document {
  tripGroupId: mongoose.Schema.Types.ObjectId;
  senderId: String;
  messageText: string;
  attachments?: string[];
  createdAt: Date;
}

const TripMessageSchema = new Schema<ITripMessage>(
  {
    tripGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "TripGroup", required: true },
    senderId: { type: String, ref: "User", required: true },
    messageText: { type: String, required: true },
    attachments: [String],
  },
  { timestamps: true }
);

export const TripMessage =
  mongoose.models.TripMessage || mongoose.model<ITripMessage>("TripMessage", TripMessageSchema);
