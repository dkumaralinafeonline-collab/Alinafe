import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

/* ============================================
   1️⃣ Get All Conversations (for Admin View)
   GET /api/admin/conversations
============================================ */
export const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAtSort: -1 })
      .lean();

    // Populate user info manually
    const userIds = [
      ...new Set(conversations.flatMap((c) => c.participants)),
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

    const data = conversations.map((conv) => ({
      _id: conv._id,
      userA: userMap[conv.participants[0]] || { name: "User" },
      userB: userMap[conv.participants[1]] || { name: "User" },
      lastMessage: conv.lastMessage || "",
      updatedAt: conv.updatedAtSort || conv.updatedAt,
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching admin conversations:", error);
    res.status(500).json({ error: "Error fetching admin conversations" });
  }
};

/* ============================================
   2️⃣ Get Messages of a Specific Conversation
   GET /api/admin/messages/:conversationId
============================================ */
export const getMessagesForAdmin = async (req, res) => {
    const { conversationId } = req.params;
  
    try {
      // 🧠 Try both formats (ObjectId or String)
      const msgs = await Message.find({
        $or: [
          { conversationId: new mongoose.Types.ObjectId(conversationId) },
          { conversationId: conversationId },
        ],
      })
        .sort({ createdAt: 1 })
        .lean();
  
      console.log(`📩 Found ${msgs.length} messages for conversation ${conversationId}`);
      res.json(msgs);
    } catch (error) {
      console.error("❌ Error fetching admin messages:", error);
      res.status(500).json({ error: "Error fetching admin messages" });
    }
  };