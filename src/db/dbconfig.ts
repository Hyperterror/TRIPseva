import mongoose from "mongoose";

let isConnected = false;

export async function connect() {
  if (isConnected) {
    return;
  }

  const dbUri = process.env.MONGO_URI;
  if (!dbUri) {
    throw new Error("Please define the MONGO_URI in your .env");
  }

  await mongoose.connect(dbUri);
  isConnected = true;
  console.log("MongoDB connected");
}
