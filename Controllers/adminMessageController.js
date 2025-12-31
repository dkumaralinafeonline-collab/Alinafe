import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

/* ============================================
   1️⃣ Get All Conversations (ADMIN ONLY)
   GET /api/admin/conversations
============================================ */
export const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAtSort: -1 })
      .lean();

    if (!conversations.length) {
      return res.json([]);
    }

    /* ----------------------------------------
       Collect unique participant UIDs
    ---------------------------------------- */
    const userIds = [
      ...new Set(
        conversations.flatMap((c) => c.participants || [])
      ),
    ];

    const users = await User.find({ uid: { $in: userIds } })
      .select("uid name displayName email photoURL")
      .lean();

    const userMap = Object.fromEntries(
      users.map((u) => [
        u.uid,
        {
          name: u.name || u.displayName || "Unknown",
          email: u.email || "",
          photo:
            u.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              u.name || "User"
            )}&background=2E3192&color=fff`,
        },
      ])
    );

    const data = conversations.map((conv) => {
      const [userAId, userBId] = conv.participants || [];

      return {
        _id: conv._id,
        userA: userMap[userAId] || { name: "User" },
        userB: userMap[userBId] || { name: "User" },
        lastMessage: conv.lastMessage || "",
        updatedAt: conv.updatedAtSort || conv.updatedAt,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching admin conversations:", error);
    res.status(500).json({
      error: "Error fetching admin conversations",
    });
  }
};

/* ============================================
   2️⃣ Get Messages of a Conversation (ADMIN)
   GET /api/admin/messages/:conversationId
============================================ */
export const getMessagesForAdmin = async (req, res) => {
  const { conversationId } = req.params;

  try {
    if (!conversationId) {
      return res
        .status(400)
        .json({ error: "Conversation ID required" });
    }

    const query = mongoose.Types.ObjectId.isValid(conversationId)
      ? {
          $or: [
            { conversationId: new mongoose.Types.ObjectId(conversationId) },
            { conversationId },
          ],
        }
      : { conversationId };

    const msgs = await Message.find(query)
      .sort({ createdAt: 1 })
      .lean();

    console.log(
      `📩 Admin fetched ${msgs.length} messages for conversation ${conversationId}`
    );

    res.json(msgs);
  } catch (error) {
    console.error("❌ Error fetching admin messages:", error);
    res.status(500).json({
      error: "Error fetching admin messages",
    });
  }
};
