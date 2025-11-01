// controllers/messageController.js
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { isUserOnline, getTypingStatus } from "../Services/presenceService.js";

/* ========================================
   Utility Helpers
======================================== */
function normalizeName(name, email) {
  if (name && name !== "Unknown") return name;
  if (email) return email?.split("@")[0] || "User";
  return "User";
}

function generateAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=2E3192&color=fff&bold=true`;
}

/* ========================================
   1️⃣ Get messages by conversation (Paginated)
   GET /api/messages/:conversationId?before=timestamp&limit=30
======================================== */
export const getMessagesByConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { before, limit = 30 } = req.query;

  try {
    const query = { conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const msgs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json(msgs.reverse());
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
};

/* ========================================
   2️⃣ Save message (REST Fallback)
   POST /api/messages
======================================== */
export const saveMessage = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      senderName,
      senderEmail,
      senderPhoto,
      receiverName,
      receiverEmail,
      receiverPhoto,
      adTitle,
      message,
    } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    /* 🟢 Step 1: Normalize Sender Info */
    const sName = senderName || normalizeName(senderName, senderEmail);
    const sEmail = senderEmail || "";
    const sPhoto =
      senderPhoto && senderPhoto.trim() !== ""
        ? senderPhoto
        : generateAvatar(sName);

    /* 🟢 Step 2: Fetch Receiver Info (if missing) */
    let rName = receiverName;
    let rEmail = receiverEmail;
    let rPhoto = receiverPhoto;

    if (!rName || !rEmail) {
      const receiver = await User.findOne({ uid: receiverId }).lean();
      if (receiver) {
        rName = receiver.name || receiver.displayName || "User";
        rEmail = receiver.email || "";
        rPhoto =
          receiver.photoURL && receiver.photoURL.trim() !== ""
            ? receiver.photoURL
            : generateAvatar(rName);
      } else {
        rName = "User";
        rEmail = "";
        rPhoto = generateAvatar(rName);
      }
    }

    /* 🟢 Step 3: Find or Create Conversation */
    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      productTitle: adTitle || "Listing",
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverId],
        productTitle: adTitle || "Listing",
        lastMessage: message,
        lastSenderId: senderId,
        unreadCounts: { [receiverId]: 1 },
        updatedAtSort: new Date(),
      });
    } else {
      convo.lastMessage = message;
      convo.lastSenderId = senderId;
      convo.updatedAtSort = new Date();
      convo.unreadCounts = {
        ...convo.unreadCounts,
        [receiverId]: (convo.unreadCounts?.[receiverId] || 0) + 1,
      };
      await convo.save();
    }

    /* 🟢 Step 4: Save Message */
    const newMessage = await Message.create({
      conversationId: convo._id,
      senderId,
      receiverId,
      senderName: sName,
      senderEmail: sEmail,
      senderPhoto: sPhoto,
      receiverName: rName,
      receiverEmail: rEmail,
      receiverPhoto: rPhoto,
      adTitle: adTitle || "Listing",
      message,
      isRead: false,
      isDelivered: false,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error saving message:", error);
    res.status(500).json({ error: "Error saving message" });
  }
};

/* ========================================
   3️⃣ Hard Delete Conversation
======================================== */
export const deleteConversationHard = async (req, res) => {
  const { conversationId } = req.params;
  try {
    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    res.json({ success: true, message: "Conversation and all messages deleted." });
  } catch (err) {
    console.error("❌ Error deleting conversation:", err);
    res.status(500).json({ error: "Error deleting conversation" });
  }
};

/* ========================================
   4️⃣ Status Helpers
======================================== */
export const getUserStatus = (req, res) => {
  const { uid } = req.params;
  res.json({ userId: uid, online: isUserOnline(uid) });
};

export const getTyping = (req, res) => {
  const { me, other } = req.params;
  const data = getTypingStatus(me, other);
  res.json(data);
};
