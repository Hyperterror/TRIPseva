import mongoose, { Schema, Document, Model } from "mongoose";

interface IRestaurant {
  placeId: string;
  name: string;
  cuisine: string[];
  rating: number;
  distance: number; // in kilometers
  priceLevel: number; // 1-4
  openingHours: string;
  address: string;
  reviews: string;
  matchScore: number;
  photoUrl?: string;
  googleMapsUrl: string;
}

export interface IItineraryRestaurants extends Document {
  itineraryId: mongoose.Types.ObjectId;
  dayNumber: number;
  mealSlot: 'breakfast' | 'lunch' | 'dinner';
  restaurants: IRestaurant[];
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    placeId: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    cuisine: {
      type: [String],
      default: []
    },
    rating: { 
      type: Number, 
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    distance: { 
      type: Number, 
      required: true,
      min: [0, 'Distance must be positive']
    },
    priceLevel: { 
      type: Number, 
      default: 2,
      min: [1, 'Price level must be at least 1'],
      max: [4, 'Price level cannot exceed 4']
    },
    openingHours: { 
      type: String, 
      default: 'Hours not available' 
    },
    address: { 
      type: String, 
      required: true 
    },
    reviews: { 
      type: String, 
      default: '' 
    },
    matchScore: { 
      type: Number, 
      default: 0,
      min: [0, 'Match score must be at least 0'],
      max: [1, 'Match score cannot exceed 1']
    },
    photoUrl: { 
      type: String 
    },
    googleMapsUrl: { 
      type: String, 
      required: true 
    }
  },
  { _id: false }
);

const ItineraryRestaurantsSchema = new Schema<IItineraryRestaurants>(
  {
    itineraryId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Itinerary', 
      required: true, 
      index: true 
    },
    dayNumber: { 
      type: Number, 
      required: true,
      min: [1, 'Day number must be at least 1']
    },
    mealSlot: { 
      type: String, 
      enum: ['breakfast', 'lunch', 'dinner'], 
      required: true 
    },
    restaurants: {
      type: [RestaurantSchema],
      validate: {
        validator: function(v: IRestaurant[]) {
          return v.length >= 0 && v.length <= 5;
        },
        message: 'Restaurants array must contain 0-5 items'
      }
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries
ItineraryRestaurantsSchema.index({ itineraryId: 1, dayNumber: 1, mealSlot: 1 });

// Prevent OverwriteModelError in dev mode
export const ItineraryRestaurants: Model<IItineraryRestaurants> =
  mongoose.models.ItineraryRestaurants || 
  mongoose.model<IItineraryRestaurants>("ItineraryRestaurants", ItineraryRestaurantsSchema);
