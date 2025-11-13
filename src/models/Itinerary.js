const ItinerarySchema = new mongoose.Schema({
  tripGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "TripGroup" },
  days: [
    {
      day: Number,
      activities: [
        {
          poi: String,
          time: String,
          notes: String
        }
      ]
    }
  ],
  createdBy: { type: String, default: "system" },
  version: { type: Number, default: 1 }
});

export const Itinerary = mongoose.model("Itinerary", ItinerarySchema);
