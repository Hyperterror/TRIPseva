// models/TripRequest.ts
import mongoose from "mongoose";

const TripRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  location: { type: String, required: true },
  date_from: { type: Date, required: true },
  date_to: { type: Date, required: true },
  interests: { type: [String], default: [] },
  group_size_pref: { min: { type: Number }, max: { type: Number } },
  status: { type: String, default: "open" },
}, { timestamps: true });

export const TripRequest =
  mongoose.models.TripRequest || mongoose.model("TripRequest", TripRequestSchema);
