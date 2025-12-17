import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },

    // text message body
    message: { type: String, default: "" },

    // message type
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document"],
      default: "text",
    },

    // attachment URL
    mediaUrl: { type: String, default: "" },
    mediaThumbnail: { type: String, default: "" },

    // Reply-to feature
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Forwarded message reference
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // read & delivery status
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },

    // delete for everyone
    isDeleted: { type: Boolean, default: false },

    // delete for me
    deletedFor: { type: [String], default: [] },
  },
  { timestamps: true }
);

// For fast pagination
messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
