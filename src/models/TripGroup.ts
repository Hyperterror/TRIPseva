import mongoose, { Schema, Document, Model } from "mongoose";

interface CompatibilityScore {
  userId1: string;
  userId2: string;
  overallScore: number;
  breakdown: {
    interestMatch: number;
    budgetMatch: number;
    timeOverlap: number;
    lifestyleMatch: number;
    foodCompatibility: number;
    accommodationMatch: number;
  };
  matchReasons: string[];
}

export interface ITripGroup extends Document {
  groupId: string;
  tripRequestIds: mongoose.Types.ObjectId[];
  members: string[];
  location: string;
  dateFrom: Date;
  dateTo: Date;
  itineraryId?: mongoose.Types.ObjectId;
  chatRoomId?: mongoose.Types.ObjectId;
  compatibilityScores?: CompatibilityScore[];
  isCompleted?: boolean;
  completedAt?: Date;
}

const CompatibilityScoreSchema = new Schema({
  userId1: { type: String, required: true },
  userId2: { type: String, required: true },
  overallScore: { type: Number, required: true, min: 0, max: 1 },
  breakdown: {
    interestMatch: { type: Number, default: 0 },
    budgetMatch: { type: Number, default: 0 },
    timeOverlap: { type: Number, default: 0 },
    lifestyleMatch: { type: Number, default: 0 },
    foodCompatibility: { type: Number, default: 0 },
    accommodationMatch: { type: Number, default: 0 }
  },
  matchReasons: [{ type: String }]
}, { _id: false });

const TripGroupSchema = new Schema<ITripGroup>(
  {
    groupId: {
      type: String,
      required: true,
      unique: true, // ensure unique id
    },
    tripRequestIds: [{ type: Schema.Types.ObjectId, ref: "TripRequest" }],
    members: [{ type: String }],
    location: String,
    dateFrom: Date,
    dateTo: Date,
    itineraryId: { type: Schema.Types.ObjectId, ref: "Itinerary" },
    chatRoomId: { type: Schema.Types.ObjectId, ref: "ChatRoom" },
    compatibilityScores: [CompatibilityScoreSchema],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// ✅ FIX: Prevent OverwriteModelError in dev mode
export const TripGroup: Model<ITripGroup> =
  mongoose.models.TripGroup || mongoose.model<ITripGroup>("TripGroup", TripGroupSchema);
