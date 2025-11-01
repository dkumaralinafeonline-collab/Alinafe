// src/models/Ad.js
import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    /* ===========================
       🧑 Ownership & Identity
    =========================== */
    ownerUid: { type: String, required: true }, // Firebase UID or internal user ID
    ownerName: { type: String },
    ownerEmail: { type: String },
    ownerPhone: { type: String },

    /* ===========================
       📦 Core Ad Info
    =========================== */
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    condition: { type: String, enum: ["New", "Used"], default: "Used" },

    /* ===========================
       💰 Pricing
    =========================== */
    price: { type: Number },
    negotiable: { type: Boolean, default: false },
    currency: { type: String, default: "MK" },

    /* ===========================
       🖼️ Media
    =========================== */
    images: [{ type: String }], // Cloudinary URLs
    videoUrl: { type: String, default: "" },

    /* ===========================
       📍 Location
    =========================== */
    city: { type: String, trim: true },
    location: { type: String, trim: true },
    deliveryAvailable: { type: Boolean, default: false },

    /* ===========================
       🚗 Vehicle Fields
    =========================== */
    year: { type: String, default: "" },
    mileage: { type: String, default: "" },

    /* ===========================
       🏠 Real Estate Fields
    =========================== */
    bedrooms: { type: String, default: "" },
    bathrooms: { type: String, default: "" },
    area: { type: String, default: "" },

    /* ===========================
       ⚡ Electronics Fields
    =========================== */
    brand: { type: String, default: "" },
    warranty: { type: String, default: "" },

    /* ===========================
       👕 Fashion Fields
    =========================== */
    size: { type: String, default: "" },
    color: { type: String, default: "" },

    /* ===========================
       💼 Job & Service Fields
    =========================== */
    salary: { type: String, default: "" },

    /* ===========================
       🌾 Agriculture / Business Fields
    =========================== */
    quantity: { type: String, default: "" },

    /* ===========================
       🎓 Kids & Education Fields
    =========================== */
    ageGroup: { type: String, default: "" },

    /* ===========================
       💻 Digital Product Fields
    =========================== */
    fileType: { type: String, default: "" },
    accessType: { type: String, default: "" },

    /* ===========================
       📊 Analytics & System Data
    =========================== */
    views: { type: Number, default: 0 },
    favouritesCount: { type: Number, default: 0 },

    // 🧠 NEW: unique view tracking
    viewedBy: {
      type: [String], // userId or guestId
      default: [],
    },

    status: {
      type: String,
      enum: ["Active", "Sold", "Expired", "Hidden"],
      default: "Active",
    },
    featured: { type: Boolean, default: false },
    expiryDate: { type: Date },

    /* ===========================
       🚨 Moderation
    =========================== */
    reported: { type: Boolean, default: false },
    reportReason: { type: String, default: "" },
  },
  { timestamps: true }
);

/* ===========================
   ⚙️ Optional: Auto-clean old view records (30 days)
=========================== */
adSchema.methods.cleanupOldViews = function () {
  // (Optional) you can expand this later if storing timestamps for views
};

export default mongoose.model("Ad", adSchema);
