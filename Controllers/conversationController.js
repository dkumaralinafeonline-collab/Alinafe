// controllers/conversationController.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { isUserOnline } from "../Services/presenceService.js";

/* =====================================================
   🟢 GET /api/conversations/:uid
   -> Return recent chats for sidebar
===================================================== */
export const getUserConversations = async (req, res) => {
  const { uid } = req.params;
  try {
    const convos = await Conversation.find({ participants: { $in: [uid] } })
      .sort({ updatedAtSort: -1 })
      .limit(50)
      .lean();

    const response = await Promise.all(
      convos.map(async (c) => {
        const partnerId = c.participants.find((p) => p !== uid);
        const lastMessageDoc = await Message.findOne({ conversationId: c._id })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = c.unreadCounts?.[uid] || 0;

        const defaultAvatar = (name) =>
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name || "User"
          )}&background=2E3192&color=fff&bold=true`;

        const senderPhoto =
          lastMessageDoc?.senderPhoto && lastMessageDoc?.senderPhoto !== ""
            ? lastMessageDoc.senderPhoto
            : defaultAvatar(
                lastMessageDoc?.senderName ||
                  lastMessageDoc?.senderEmail?.split("@")[0]
              );

        const receiverPhoto =
          lastMessageDoc?.receiverPhoto && lastMessageDoc?.receiverPhoto !== ""
            ? lastMessageDoc.receiverPhoto
            : defaultAvatar(
                lastMessageDoc?.receiverName ||
                  lastMessageDoc?.receiverEmail?.split("@")[0]
              );

        return {
          conversationId: c._id,
          withUserId: partnerId,
          productTitle: c.productTitle,
          lastMessage: c.lastMessage || "",
          lastMessageAt: lastMessageDoc?.createdAt || c.updatedAtSort,
          unreadCount,
          online: isUserOnline(partnerId),
          withUserName:
            lastMessageDoc?.senderId === uid
              ? lastMessageDoc?.receiverName || lastMessageDoc?.receiverEmail
              : lastMessageDoc?.senderName || lastMessageDoc?.senderEmail,
          withUserEmail:
            lastMessageDoc?.senderId === uid
              ? lastMessageDoc?.receiverEmail
              : lastMessageDoc?.senderEmail,
          withUserPhoto:
            lastMessageDoc?.senderId === uid ? receiverPhoto : senderPhoto,
        };
      })
    );

    response.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(500).json({ error: "Error fetching user conversations" });
  }
};

/* =====================================================
   🟢 PUT /api/conversations/:conversationId/mark-read/:userId
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
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking conversation read:", err);
    res.status(500).json({ error: "Error marking conversation as read" });
  }
};

/* =====================================================
   🟢 POST /api/conversations/start
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
        productTitle: productTitle || "Listing",
        unreadCounts: { [senderId]: 0, [receiverId]: 0 },
        updatedAtSort: new Date(),
        lastMessage: "",
      });
    }

    res.status(200).json(convo);
  } catch (err) {
    console.error("❌ Error starting conversation:", err);
    res.status(500).json({ error: "Failed to start conversation" });
  }
};
