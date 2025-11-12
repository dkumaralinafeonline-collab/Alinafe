// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // --- Firebase Identity ---
    uid: { type: String, required: true, unique: true }, // Firebase UID

    // --- Basic Info ---
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },

    // --- Account Status ---
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    adsPosted: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now },

    // --- 🧡 Favorites List (Wishlist System) ---
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ad", // Reference to Ad model
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
