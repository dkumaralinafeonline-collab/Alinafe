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
    status: { type: String, enum: ["Active", "Suspended"], default: "Active" },
    lastLogin: { type: Date, default: Date.now },

    // --- 🧡 Favorites List (Added for Wishlist System) ---
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ad", // Reference to Ad model
      },
    ],
  },
  { timestamps: true }
);

// Export model
const User = mongoose.model("User", userSchema);
export default User;
