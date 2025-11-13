import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFoodPreferences extends Document {
  userId: string;
  dietaryRestrictions: string[]; // ['vegetarian', 'gluten_free', etc.]
  cuisinePreferences: string[]; // ['italian', 'indian', 'thai', etc.]
  mealTypePreferences: string[]; // ['street_food', 'fine_dining', etc.]
  allergies: string | null;
  avgMealBudget: 'budget' | 'moderate' | 'premium' | null;
  createdAt: Date;
  updatedAt: Date;
}

const FoodPreferencesSchema = new Schema<IFoodPreferences>(
  {
    userId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    dietaryRestrictions: {
      type: [String],
      default: []
    },
    cuisinePreferences: {
      type: [String],
      default: []
    },
    mealTypePreferences: {
      type: [String],
      default: []
    },
    allergies: { 
      type: String, 
      default: null,
      maxlength: [500, 'Allergies description cannot exceed 500 characters']
    },
    avgMealBudget: { 
      type: String, 
      enum: ['budget', 'moderate', 'premium', null],
      default: null 
    }
  },
  { timestamps: true }
);

// Prevent OverwriteModelError in dev mode
export const FoodPreferences: Model<IFoodPreferences> =
  mongoose.models.FoodPreferences || 
  mongoose.model<IFoodPreferences>("FoodPreferences", FoodPreferencesSchema);
