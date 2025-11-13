import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserPreferences extends Document {
  userId: string; // Clerk user ID
  alcoholConsumption: 'teetotaler' | 'occasional' | 'regular' | 'no_preference' | null;
  smoking: 'non_smoker' | 'smoker' | 'no_preference' | null;
  activityLevel: 'relaxed' | 'moderate' | 'high_energy' | null;
  sleepSchedule: 'early_riser' | 'night_owl' | 'flexible' | null;
  budgetFlexibility: 'strict' | 'flexible' | 'open_ended' | null;
  accommodationPreference: 'budget' | 'mid_range' | 'luxury' | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    alcoholConsumption: { 
      type: String, 
      enum: ['teetotaler', 'occasional', 'regular', 'no_preference', null],
      default: null 
    },
    smoking: { 
      type: String, 
      enum: ['non_smoker', 'smoker', 'no_preference', null],
      default: null 
    },
    activityLevel: { 
      type: String, 
      enum: ['relaxed', 'moderate', 'high_energy', null],
      default: null 
    },
    sleepSchedule: { 
      type: String, 
      enum: ['early_riser', 'night_owl', 'flexible', null],
      default: null 
    },
    budgetFlexibility: { 
      type: String, 
      enum: ['strict', 'flexible', 'open_ended', null],
      default: null 
    },
    accommodationPreference: { 
      type: String, 
      enum: ['budget', 'mid_range', 'luxury', null],
      default: null 
    }
  },
  { timestamps: true }
);

// Prevent OverwriteModelError in dev mode
export const UserPreferences: Model<IUserPreferences> =
  mongoose.models.UserPreferences || 
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);
