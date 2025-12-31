// controllers/conversationController.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/* =====================================================
   🟢 GET /api/conversations/:uid
   → Fetch all chats for Sidebar (FULL DATA)
===================================================== */
export const getUserConversations = async (req, res) => {
  const { uid } = req.params;

  // 🔐 OWNERSHIP CHECK
  if (req.user.uid !== uid) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const convos = await Conversation.find({
      participants: { $in: [uid] },
    })
      .sort({ updatedAtSort: -1 })
      .limit(50)
      .lean();

    const response = await Promise.all(
      convos.map(async (c) => {
        const partnerId = c.participants.find((p) => p !== uid);

        // 👤 FETCH PARTNER
        const partner = await User.findOne({ uid: partnerId }).lean();

        // ✅ SAFE PARTNER OBJECT
        const safePartner = {
          uid: partnerId,
          name: partner?.name || "User",
          email: partner?.email || "",
          photoURL:
            partner?.photoURL && partner.photoURL.trim() !== ""
              ? partner.photoURL
              : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          lastSeen: partner?.lastLogin || null,
        };

        // 💬 LAST MESSAGE
        const lastMessageDoc = await Message.findOne({
          conversationId: c._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        // 🔔 UNREAD COUNT (Map + Object safe)
        const unreadCount =
          typeof c.unreadCounts?.get === "function"
            ? c.unreadCounts.get(uid) || 0
            : c.unreadCounts?.[uid] || 0;

        return {
          conversationId: c._id,

          // 👤 USER INFO (IMPORTANT)
          withUserId: safePartner.uid,
          withUserName: safePartner.name,
          withUserEmail: safePartner.email,
          withUserPhoto: safePartner.photoURL,
          lastSeen: safePartner.lastSeen,

          // 🧾 AD CONTEXT
          adId: c.adId || null,
          productTitle: c.productTitle || "",
          productImage: c.productImage || "",

          // 💬 LAST MESSAGE PREVIEW
          lastMessage: lastMessageDoc?.message || "",
          lastMessageType: lastMessageDoc?.type || "text",
          lastSenderId: lastMessageDoc?.senderId || null,
          lastMessageAt: lastMessageDoc?.createdAt || c.updatedAtSort,

          unreadCount,
        };
      })
    );

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ error: "Error fetching user conversations" });
  }
};

/* =====================================================
   🟢 GET /api/conversations/preview/:uid
   → Lightweight preview (Dashboard)
===================================================== */
export const getConversationPreview = async (req, res) => {
  const { uid } = req.params;

  if (req.user.uid !== uid) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const convos = await Conversation.find({
      participants: { $in: [uid] },
    })
      .sort({ updatedAtSort: -1 })
      .limit(5)
      .lean();

    const preview = await Promise.all(
      convos.map(async (c) => {
        const partnerId = c.participants.find((p) => p !== uid);

        // 👤 FETCH PARTNER (MISSING BUG FIXED HERE)
        const partner = await User.findOne(
          { uid: partnerId },
          { name: 1, photoURL: 1 }
        ).lean();

        // ✅ SAFE PARTNER
        const safePartner = {
          name: partner?.name || "User",
          photoURL:
            partner?.photoURL && partner.photoURL.trim() !== ""
              ? partner.photoURL
              : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        };

        const unreadCount =
          typeof c.unreadCounts?.get === "function"
            ? c.unreadCounts.get(uid) || 0
            : c.unreadCounts?.[uid] || 0;

        return {
          conversationId: c._id,

          withUserId: partnerId,
          withUserName: safePartner.name,
          withUserPhoto: safePartner.photoURL,

          // 🧾 AD CONTEXT
          adId: c.adId || null,
          productTitle: c.productTitle || "",
          productImage: c.productImage || "",

          lastMessage: c.lastMessage || "",
          lastSenderId: c.lastSenderId || null,
          lastMessageAt: c.updatedAtSort,

          unreadCount,
        };
      })
    );

    res.json(preview);
  } catch (err) {
    console.error("❌ Error fetching conversation preview:", err);
    res.status(500).json({ error: "Error fetching chat preview" });
  }
};

/* =====================================================
   🟢 PUT /api/conversations/:conversationId/mark-read
===================================================== */
export const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const uid = req.user.uid;

    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${uid}`]: 0 } }
    );

    await Message.updateMany(
      {
        conversationId,
        receiverId: uid,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking conversation read:", err);
    res.status(500).json({ message: "Error marking conversation read" });
  }
};

/* =====================================================
   🟢 POST /api/conversations/start
===================================================== */
export const startConversation = async (req, res) => {
  try {
    const { senderId, receiverId, adId, adTitle, adImage } = req.body;

    if (req.user.uid !== senderId) {
      return res.status(403).json({ message: "Access denied" });
    }

    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      adId: adId || null,
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverId],

        adId: adId || null,
        productTitle: adTitle || "Listing",
        productImage: adImage || "",

        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 0,
        },

        updatedAtSort: new Date(),
      });
    }

    res.json(convo);
  } catch (err) {
    console.error("❌ Error starting conversation:", err);
    res.status(500).json({ error: "Failed to start conversation" });
  }
};

/* =====================================================
   🟢 DELETE /api/conversations/:conversationId
===================================================== */
export const deleteConversationHard = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const convo = await Conversation.findById(conversationId);

    if (!convo) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!convo.participants.includes(req.user.uid)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    res.json({
      success: true,
      message: "Conversation deleted with all messages.",
    });
  } catch (err) {
    console.error("❌ Error deleting conversation:", err);
    res.status(500).json({ error: "Error deleting conversation" });
  }
};
