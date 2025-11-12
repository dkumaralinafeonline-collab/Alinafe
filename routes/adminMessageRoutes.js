import express from "express";
import {
  getAllConversations,
  getMessagesForAdmin,
} from "../controllers/adminMessageController.js";

const router = express.Router();

// ✅ Get all conversations for admin
router.get("/conversations", getAllConversations);

// ✅ Get all messages of one conversation
router.get("/messages/:conversationId", getMessagesForAdmin);

export default router;
