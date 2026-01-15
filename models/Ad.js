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
    userId: {
      type: String,
      default: "",
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
 /* ===========================
   🖼️ MEDIA (Images + Video)
=========================== */
images: {
  type: [String],
  default: [],
},
video: {
  url: {
    type: String,
    default: "",
  },
  thumbnail: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 0,
  },
  size: {
    type: Number,
    default: 0,
  },
  format: {
    type: String,
    default: "",
  },
  publicId: {
    type: String,
    default: "",
  },
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

    /* ===========================
   🌍 GEO LOCATION (FOR NEARBY / TRENDING)
=========================== */
geo: {
   type: {
     type: String,
     enum: ["Point"],
     default: undefined
   },
   coordinates: {
     type: [Number], // [lng, lat]
     default: undefined
   }
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
    parking: { type: String, default: "" },
    washroom: { type: String, default: "" },
    roomType: { type: String, default: "" },
    plotArea: { type: String, default: "" },
    plotType: { type: String, default: "" },
    facing: { type: String, default: "" },

    /* =================================================
       🚗 VEHICLES
    ================================================= */
    brand: { type: String, default: "" },
    partName: { type: String, default: "" },
    partCategory: { type: String, default: "" },
    originalType: { type: String, default: "" },
    workingStatus: { type: String, default: "" },
    accessoryType: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    year: { type: String, default: "" },
    mileage: { type: String, default: "" },
    fuelType: { type: String, default: "" },

    /* =================================================
       ⚡ ELECTRONICS / MOBILES
    ================================================= */
    model: { type: String, default: "" },
    storage: { type: String, default: "" },
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
    sportType: { type: String, default: "" },
    weight: { type: String, default: "" },

    /* =================================================
       📦 AGRICULTURE / BUSINESS
    ================================================= */
    quantity: { type: String, default: "" },

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
      enum: ["Pending", "Approved", "Rejected", "Sold", "deleted"],
      default: "Pending",
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: "",
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
   🔍 INDEXES (FINAL)
=========================== */

// ✅ ONLY ONE TEXT INDEX
adSchema.index({
  title: "text",
  description: "text",
  category: "text",
  subcategory: "text",
/* ===========================
   🔑 SEARCH TAGS
=========================== */
tags: {
  type: [String],
  default: [],
},
});

// ✅ FILTER INDEXES
adSchema.index({ city: 1, status: 1 });
adSchema.index({ price: 1 });
adSchema.index({ ownerUid: 1, createdAt: -1 });

// ✅ GEO SEARCH
adSchema.index({ geo: "2dsphere" });



export default mongoose.model("Ad", adSchema);
