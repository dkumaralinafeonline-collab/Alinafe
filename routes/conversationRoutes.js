import express from "express";
import {
  getUserConversations,
  markConversationRead,
  startConversation,
  deleteConversationHard,
} from "../controllers/conversationController.js";

const router = express.Router();

// Start new or fetch existing conversation
router.post("/start", startConversation);

// Get all conversations of a user
router.get("/:uid", getUserConversations);

// Mark conversation read
router.put("/:conversationId/mark-read/:userId", markConversationRead);

// Hard delete a conversation
router.delete("/delete/:conversationId", deleteConversationHard);

export default router;
