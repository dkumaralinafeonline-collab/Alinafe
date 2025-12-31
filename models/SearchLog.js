import mongoose from "mongoose";

const searchLogSchema = new mongoose.Schema(
  {
    // normalized query (lowercase + trimmed)
    query: { type: String, required: true, trim: true, index: true },

    // city/location filter (Mathura / Delhi etc.)
    city: { type: String, default: "", trim: true, index: true },

    // how many times searched
    count: { type: Number, default: 1 },

    // latest time when searched (useful for trending windows)
    lastSearchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// ✅ prevent duplicates
searchLogSchema.index({ query: 1, city: 1 }, { unique: true });

export default mongoose.model("SearchLog", searchLogSchema);
