// controllers/messageController.js
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

/* =====================================================
   🔹 Utility
===================================================== */
function detectType(body, fileUrl) {
  if (fileUrl) return body.type || "image";
  return "text";
}

/* =====================================================
   🔹 Get Messages (Older + Newer Pagination)
   GET /api/messages/:conversationId?before=&after=&limit=
===================================================== */
export const getMessagesByConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { before, after, limit = 30 } = req.query;

  try {
    const query = { conversationId };

    if (before) query.createdAt = { $lt: new Date(before) };
    if (after) query.createdAt = { $gt: new Date(after) };

    const msgs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("replyTo forwardedFrom")
      .lean();

    res.json(msgs.reverse());
  } catch (err) {
    console.error("❌ Pagination Error:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
};

/* =====================================================
   🔹 Send New Message (Text/Media/Reply/Forward)
===================================================== */
export const saveMessage = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      message,
      mediaUrl,
      mediaThumbnail,
      replyTo,
      forwardedFrom,
      adTitle,
    } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Detect message type
    const finalType = detectType(req.body, mediaUrl);

    /* =====================================================
       🟢 Find or create conversation
    ====================================================== */
    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      productTitle: adTitle || "Listing",
    });

    if (!convo) {
      // If no conversation exists → create one
      convo = await Conversation.create({
        participants: [senderId, receiverId],
        productTitle: adTitle || "Listing",
        lastMessage: finalType === "text" ? message : `[${finalType}]`,
        lastSenderId: senderId,
        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 1,
        },
        updatedAtSort: new Date(),
      });
    } else {
      // Update existing conversation
      convo.lastMessage =
        finalType === "text" ? message : `[${finalType}]`;
      convo.lastSenderId = senderId;
      convo.updatedAtSort = new Date();

      // Support both Map and Object
      if (typeof convo.unreadCounts?.get === "function") {
        convo.unreadCounts.set(
          receiverId,
          (convo.unreadCounts.get(receiverId) || 0) + 1
        );
      } else {
        convo.unreadCounts[receiverId] =
          (convo.unreadCounts?.[receiverId] || 0) + 1;
      }

      await convo.save();
    }

    /* =====================================================
       🟢 Create message document
    ====================================================== */
    const newMessage = await Message.create({
      conversationId: convo._id,
      senderId,
      receiverId,
      message,
      type: finalType,
      mediaUrl,
      mediaThumbnail,
      replyTo,
      forwardedFrom,
      isDelivered: false,
      isRead: false,
    });

    const populatedMsg = await newMessage.populate(
      "replyTo forwardedFrom"
    );

    res.status(201).json(populatedMsg);
  } catch (error) {
    console.error("❌ Send Message Error:", error);
    res.status(500).json({ error: "Error sending message" });
  }
};

/* =====================================================
   🔹 Mark Delivered
===================================================== */
export const markDelivered = async (req, res) => {
  const { messageId } = req.params;

  try {
    await Message.updateOne(
      { _id: messageId },
      { isDelivered: true, deliveredAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark delivered error:", err);
    res.status(500).json({ error: "Error marking delivered" });
  }
};

/* =====================================================
   🔹 Mark Seen
===================================================== */
export const markSeen = async (req, res) => {
  const { conversationId, userId } = req.params;

  try {
    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Seen Error:", err);
    res.status(500).json({ error: "Error marking seen" });
  }
};

/* =====================================================
   🔹 Delete For Everyone
===================================================== */
export const deleteForEveryone = async (req, res) => {
  const { messageId } = req.params;

  try {
    await Message.updateOne(
      { _id: messageId },
      {
        isDeleted: true,
        message: "",
        mediaUrl: "",
        mediaThumbnail: "",
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Everyone Error:", err);
    res.status(500).json({ error: "Error deleting for everyone" });
  }
};

/* =====================================================
   🔹 Delete For Me Only
===================================================== */
export const deleteForMe = async (req, res) => {
  const { messageId, uid } = req.params;

  try {
    await Message.updateOne(
      { _id: messageId },
      { $addToSet: { deletedFor: uid } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Me Error:", err);
    res.status(500).json({ error: "Error deleting message for user" });
  }
};
