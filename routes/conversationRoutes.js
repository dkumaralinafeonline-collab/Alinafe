import express from "express";
import {
  getUserConversations,
  markConversationRead,
  startConversation,
} from "../Controllers/conversationController.js";

const router = express.Router();

// 🟢 Start new or fetch existing
router.post("/start", startConversation);

// 🟢 Get all conversations for a user
router.get("/:uid", getUserConversations);

// 🟢 Mark conversation as read
router.put("/:conversationId/mark-read/:userId", markConversationRead);

export default router;
