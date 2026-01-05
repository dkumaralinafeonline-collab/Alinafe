import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    // 🔗 Which ad this report is for
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      required: true,
    },

    adTitle: {
      type: String,
      required: true,
    },

    // 🧍 Seller details
    sellerId: {
      type: String,
      required: true,
    },

    // 🧍 Reporter (User) details
    reporterId: {
      type: String,
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },

    // 🧾 Report details
    reason: {
      type: String,
      required: true,
      enum: [
        "Offensive content",
        "Fraud",
        "Duplicate ad",
        "Product already sold",
        "Other",
      ],
    },
    message: {
      type: String,
      required: true,
    },

    // 📸 Proof file (optional)
    fileUrl: {
      type: String,
      default: "",
    },

    // 🧩 Status control (admin updates)
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Admin resolution metadata
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    action: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

// ✅ Index for faster query by reporterId or adId
reportSchema.index({ reporterId: 1, adId: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
  
