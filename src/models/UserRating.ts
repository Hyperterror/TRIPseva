import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserRating extends Document {
  raterId: string; // User who gave the rating (Clerk user ID)
  ratedUserId: string; // User who received the rating (Clerk user ID)
  tripGroupId: mongoose.Types.ObjectId;
  starRating: number; // 1-5
  feedback: string;
  isReported: boolean;
  reportReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserRatingSchema = new Schema<IUserRating>(
  {
    raterId: { 
      type: String, 
      required: true, 
      index: true 
    },
    ratedUserId: { 
      type: String, 
      required: true, 
      index: true 
    },
    tripGroupId: { 
      type: Schema.Types.ObjectId, 
      ref: 'TripGroup', 
      required: true 
    },
    starRating: { 
      type: Number, 
      required: true,
      min: [1, 'Star rating must be at least 1'],
      max: [5, 'Star rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Star rating must be an integer'
      }
    },
    feedback: { 
      type: String, 
      required: true,
      minlength: [20, 'Feedback must be at least 20 characters'],
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    },
    isReported: { 
      type: Boolean, 
      default: false 
    },
    reportReason: { 
      type: String 
    }
  },
  { timestamps: true }
);

// Prevent duplicate ratings for same trip - unique compound index
UserRatingSchema.index(
  { raterId: 1, ratedUserId: 1, tripGroupId: 1 }, 
  { unique: true }
);

// Prevent OverwriteModelError in dev mode
export const UserRating: Model<IUserRating> =
  mongoose.models.UserRating || 
  mongoose.model<IUserRating>("UserRating", UserRatingSchema);
