// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // --- Firebase Identity ---
    uid: { type: String, required: true, unique: true },  // Firebase UID

    // --- Basic Information ---
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: { type: String, default: "" },
    phone: { type: String, default: "" },
    contactNumber: { type: String, default: "", index: true },
    category: { type: String, default: "" },

    // --- Location Info (For Analytics + Nearby Ads) ---
    location: { type: String, default: "" },   // Full address / area like "Andheri West"
    city: { type: String, default: "" },       // Clean city name → "Mumbai"
    state: { type: String, default: "" },      // Optional but useful → "Maharashtra"

    // --- Account Status ---
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    authProvider: {
      type: String,
      enum: ["google", "password", "google+password"],
      default: "google",
    },
    passwordHash: { type: String, default: null },
    lastLoginNotifiedAt: { type: Date, default: null },
    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpLastSentAt: { type: Date, default: null },
    emailOtpWindowStart: { type: Date, default: null },
    emailOtpSendCount: { type: Number, default: 0 },
    passwordResetOtpHash: { type: String, default: null },
    passwordResetOtpExpiresAt: { type: Date, default: null },
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetOtpWindowStart: { type: Date, default: null },
    passwordResetOtpSendCount: { type: Number, default: 0 },
    passwordResetVerifiedAt: { type: Date, default: null },
    adsPosted: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now },

    // --- 🧡 Favorites (Wishlist System) ---
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ad",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
