// routes/messageRoutes.js
import express from "express";
import {
  getMessagesByConversation,
  saveMessage,
  deleteConversationHard,
  getUserStatus,
  getTyping,
} from "../controllers/messageController.js";

const router = express.Router();

/**
 * Messages of a single conversation (paginated)
 * GET /api/messages/:conversationId?before=&limit=
 */
router.get("/:conversationId", getMessagesByConversation);

/**
 * Send/store message (REST fallback)
 * POST /api/messages
 */
router.post("/", saveMessage);

/**
 * Delete entire conversation
 * DELETE /api/messages/hard-delete/:conversationId
 */
router.delete("/hard-delete/:conversationId", deleteConversationHard);

/**
 * Presence
 * GET /api/messages/status/:uid
 */
router.get("/status/:uid", getUserStatus);

/**
 * Typing
 * GET /api/messages/typing/:me/:other
 */
router.get("/typing/:me/:other", getTyping);

export default router;
