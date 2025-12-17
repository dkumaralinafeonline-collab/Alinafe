// controllers/conversationController.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/* =====================================================
   🟢 GET /api/conversations/:uid
   → Fetch all chats for Sidebar (Optimized + Safe)
===================================================== */
export const getUserConversations = async (req, res) => {
  const { uid } = req.params;

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

        // Fetch partner info
        const partner = await User.findOne({ uid: partnerId }).lean();

        // Fetch last message
        const lastMessageDoc = await Message.findOne({
          conversationId: c._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        // 🟢 Safe unreadCount (supports BOTH Map & Object)
        const unreadCount =
          typeof c.unreadCounts?.get === "function"
            ? c.unreadCounts.get(uid) || 0
            : c.unreadCounts?.[uid] || 0;

        return {
          conversationId: c._id,

          withUserId: partnerId,
          withUserName: partner?.name || "User",
          withUserEmail: partner?.email || "",
          withUserPhoto: partner?.photoURL || "",
          lastSeen: partner?.lastSeen || null,

          productTitle: c.productTitle,

          lastMessage: lastMessageDoc?.message || "",
          lastMessageType: lastMessageDoc?.type || "text",
          lastSenderId: lastMessageDoc?.senderId,
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
   🟢 PUT /api/conversations/:conversationId/mark-read/:userId
   → Reset unread count + mark messages as read
===================================================== */
export const markConversationRead = async (req, res) => {
  const { conversationId, userId } = req.params;

  try {
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${userId}`]: 0 } }
    );

    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking read:", err);
    res.status(500).json({ error: "Error marking conversation read" });
  }
};

/* =====================================================
   🟢 POST /api/conversations/start
   → Start or get conversation
===================================================== */
export const startConversation = async (req, res) => {
  try {
    const { senderId, receiverId, productTitle } = req.body;

    if (!senderId || !receiverId || !productTitle) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      productTitle,
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverId],
        productTitle,
        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 0,
        },
        updatedAtSort: new Date(),
        lastMessage: "",
      });
    }

    res.json(convo);
  } catch (err) {
    console.error("❌ Error starting conversation:", err);
    res.status(500).json({ error: "Failed to start conversation" });
  }
};

/* =====================================================
   🟢 DELETE (HARD DELETE)
===================================================== */
export const deleteConversationHard = async (req, res) => {
  const { conversationId } = req.params;

  try {
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
