// src/models/Ad.js
import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    /* ===========================
       👤 OWNERSHIP & IDENTITY
    =========================== */
    ownerUid: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      default: "",
      trim: true,
    },
    ownerEmail: {
      type: String,
      default: "",
      trim: true,
    },
    ownerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===========================
       📦 CORE AD INFO
    =========================== */
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===========================
       🧱 CONDITION
       (Not applicable for Jobs / Services / Pets)
    =========================== */
    condition: {
      type: String,
      enum: ["New", "Used", "Not Applicable"],
      default: "Not Applicable",
    },

    /* ===========================
       💰 PRICING
    =========================== */
    price: {
      type: Number,
      default: null,
      min: 0,
      index: true,
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      default: "₹",
    },

    /* ===========================
       🖼️ MEDIA
    =========================== */
    images: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: "",
    },

    /* ===========================
       📍 LOCATION
    =========================== */
    city: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },

    /* =================================================
       🏠 REAL ESTATE
    ================================================= */
    bedrooms: { type: String, default: "" },
    bathrooms: { type: String, default: "" },
    area: { type: String, default: "" },
    furnishing: { type: String, default: "" },

    /* =================================================
       🚗 VEHICLES
    ================================================= */
    brand: { type: String, default: "" },
    year: { type: String, default: "" },
    mileage: { type: String, default: "" },
    fuelType: { type: String, default: "" },

    /* =================================================
       ⚡ ELECTRONICS / MOBILES
    ================================================= */
    model: { type: String, default: "" },
    warranty: { type: String, default: "" },
    conditionNote: { type: String, default: "" },

    /* =================================================
       👕 FASHION
    ================================================= */
    size: { type: String, default: "" },
    color: { type: String, default: "" },

    /* =================================================
       💼 JOBS
    ================================================= */
    salary: {
      type: Number,
      default: null,
      min: 0,
    },
    jobType: { type: String, default: "" },        // Full-time / Part-time
    experience: { type: String, default: "" },     // 0-1, 2-3 yrs
    company: { type: String, default: "" },

    /* =================================================
       🐶 PETS
    ================================================= */
    petType: { type: String, default: "" },
    breed: { type: String, default: "" },
    age: { type: String, default: "" },
    vaccinated: { type: String, default: "" },     // Yes / No

    /* =================================================
       🛠 SERVICES
    ================================================= */
    serviceType: { type: String, default: "" },
    availability: { type: String, default: "" },   // Full day / Weekends
    serviceArea: { type: String, default: "" },

    /* =================================================
       📦 AGRICULTURE / BUSINESS
    ================================================= */
    quantity: { type: String, default: "" },

    /* =================================================
       🎓 KIDS / EDUCATION
    ================================================= */
    ageGroup: { type: String, default: "" },

    /* =================================================
       💻 DIGITAL PRODUCTS
    ================================================= */
    fileType: { type: String, default: "" },
    accessType: { type: String, default: "" },

    /* ===========================
       📊 ANALYTICS
    =========================== */
    views: {
      type: Number,
      default: 0,
    },
    favouritesCount: {
      type: Number,
      default: 0,
    },
    viewedBy: {
      type: [String],
      default: [],
    },

    /* ===========================
       🛡 STATUS & MODERATION
    =========================== */
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Sold", "Deleted", "Active"],
      default: "Pending",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
      default: null,
    },

    reported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   🔍 INDEXES (SEARCH / FILTER)
=========================== */
adSchema.index({ title: "text", description: "text" });
adSchema.index({ category: 1, city: 1, price: 1 });
adSchema.index({ ownerUid: 1, createdAt: -1 });

export default mongoose.model("Ad", adSchema);
