// routes/messageRoutes.js
import express from "express";
import {
  getMessagesByConversation,
  saveMessage,
  markDelivered,
  markSeen,
  deleteForEveryone,
  deleteForMe
} from "../Controllers/messageController.js";

const router = express.Router();

/* ============================================================
   🔹 Get messages (pagination)
============================================================ */
router.get("/:conversationId", getMessagesByConversation);

/* ============================================================
   🔹 Send text / media / reply / forward
============================================================ */
router.post("/", saveMessage);

/* ============================================================
   🔹 Mark delivered
============================================================ */
router.put("/delivered/:messageId", markDelivered);

/* ============================================================
   🔹 Mark seen
============================================================ */
router.put("/seen/:conversationId/:userId", markSeen);

/* ============================================================
   🔹 Delete for everyone
============================================================ */
router.put("/delete-everyone/:messageId", deleteForEveryone);

/* ============================================================
   🔹 Delete for me only
============================================================ */
router.put("/delete-me/:messageId/:uid", deleteForMe);

export default router;
