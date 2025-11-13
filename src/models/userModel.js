import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    username: { type: String, required: true },
    phone: String,
    dob: Date,
    gender: String,
    photos: [String],
    bio: String,
    hometown: String,
    verified: { type: Boolean, default: false },
    profileImg: {
      type: String,
      default:
        "https://res.cloudinary.com/dguqpdnw6/image/upload/v1750306565/codeconnect/vpprdbsn4uxjfygao27v.png",
      required: [true, "Provide image"],
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
