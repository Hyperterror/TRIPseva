import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITripRequest extends Document {
    userId: string;
    location: string;
    date_from: Date;
    date_to: Date;
    interests: string[];
    group_size_pref: { min?: number; max?: number };
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const TripRequestSchema = new Schema<ITripRequest>({
    userId: { type: String, required: true },
    location: { type: String, required: true },
    date_from: { type: Date, required: true },
    date_to: { type: Date, required: true },
    interests: { type: [String], default: [] },
    group_size_pref: { min: { type: Number }, max: { type: Number } },
    status: { type: String, default: "open" },
}, { timestamps: true });

export const TripRequest: Model<ITripRequest> =
    mongoose.models.TripRequest || mongoose.model<ITripRequest>("TripRequest", TripRequestSchema);
