// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // link to Conversation._id (ObjectId)
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },

    // snapshot sender info
    senderName: { type: String },
    senderEmail: { type: String },
    senderPhoto: { type: String },

    // snapshot receiver info (good for showing in UI)
    receiverName: { type: String },
    receiverEmail: { type: String },
    receiverPhoto: { type: String },

    adTitle: { type: String }, // product context

    message: { type: String, required: true },

    // read receipt
    isRead: { type: Boolean, default: false },

    // delivery tracking
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// sort/filter performance for chat histories
messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
