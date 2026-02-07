import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    /* =====================================================
       🔹 Core Relations
    ===================================================== */
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: String,
      required: true,
      index: true,
    },

    receiverId: {
      type: String,
      required: true,
      index: true,
    },

    /* =====================================================
       🔹 Message Content
    ===================================================== */
    // text body (empty when media-only or deleted)
    message: {
      type: String,
      default: "",
      trim: true,
    },

    // message type
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "document",
        "deleted", // ✅ VERY IMPORTANT (delete for everyone placeholder)
      ],
      default: "text",
      index: true,
    },

    // client-side temp id for optimistic UI reconciliation
    clientTempId: {
      type: String,
      default: null,
      index: true,
    },

    /* =====================================================
       🔹 Media (Image / Video / Audio / Docs)
    ===================================================== */
    mediaUrl: {
      type: String,
      default: "",
    },

    mediaThumbnail: {
      type: String,
      default: "",
    },

    // 🔥 PRO MOVE: store cloudinary publicId (safe delete)
    mediaPublicId: {
      type: String,
      default: "",
    },

    /* =====================================================
       🔹 Reply / Forward
    ===================================================== */
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    /* =====================================================
       🔹 Delivery & Read Status
    ===================================================== */
    isDelivered: {
      type: Boolean,
      default: false,
      index: true,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       🔹 Delete Logic
    ===================================================== */
    // delete for everyone
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // delete for me only (uids list)
    deletedFor: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

/* =====================================================
   🔹 Indexes (Performance Boost)
===================================================== */

// Pagination (chat scroll)
messageSchema.index({ conversationId: 1, createdAt: 1 });

// Inbox queries
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// Media queries
messageSchema.index({ mediaPublicId: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
