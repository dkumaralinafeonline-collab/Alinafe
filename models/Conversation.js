import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [String], // [senderId, receiverId]
      required: true,
      index: true,
    },

    productTitle: {
      type: String,
      required: true,
      trim: true,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastSenderId: {
      type: String,
      default: "",
    },

    // 🔥 Better unread count format (Map is safest)
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    // 🔥 sorting field for sidebar
    updatedAtSort: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

/* ================================================
   INDEXES (Optimized for Chat Performance)
================================================ */

// ❌ remove unique index – wrong for chat apps
// ConversationSchema.index({ participants: 1, productTitle: 1 }, { unique: true });

// 🔥 keep searchable index for participant-based queries
ConversationSchema.index({ participants: 1 });

// 🔥 sort index
ConversationSchema.index({ updatedAtSort: -1 });

export default mongoose.model("Conversation", ConversationSchema);
