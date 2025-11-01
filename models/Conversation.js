import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [String], // [senderId, receiverId]
      required: true,
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
    unreadCounts: {
      type: Object, // ✅ simpler and JSON-safe
      default: {},
    },
    updatedAtSort: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* ✅ FIXED INDEXES */

// ❌ removed old unique index (causing duplicates)
// ConversationSchema.index({ participants: 1, productTitle: 1 }, { unique: true });

// ✅ use participants-only index
ConversationSchema.index({ participants: 1 }, { unique: false });

// ✅ keep sort index for latest chats
ConversationSchema.index({ updatedAtSort: -1 });

export default mongoose.model("Conversation", ConversationSchema);
