import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  interests: [String],
  travelStyle: String,
  budgetMin: Number,
  budgetMax: Number,
  languages: [String],
  mobilityNeeds: String,
});

export const Preferences = mongoose.model("Preferences", PreferencesSchema);
