import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    keywords: [String],
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
