import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  getMessagesByConversation,
  saveMessage,
  deleteForEveryone,
  deleteForMe,
} from "../Controllers/messageController.js";

const router = express.Router();

/* ============================================================
   🔹 GET MESSAGES (BY CONVERSATION)
============================================================ */
router.get(
  "/:conversationId",
  authMiddleware,
  getMessagesByConversation
);

/* ============================================================
   🔹 SEND MESSAGE (TEXT / MEDIA)
============================================================ */
router.post(
  "/",
  authMiddleware,
  saveMessage
);

/* ============================================================
   🔹 DELETE MESSAGE FOR EVERYONE
   (Sender only — controller validates)
============================================================ */
router.put(
  "/delete-everyone/:messageId",
  authMiddleware,
  deleteForEveryone
);

/* ============================================================
   🔹 DELETE MESSAGE FOR ME ONLY
============================================================ */
router.put(
  "/delete-me/:messageId",
  authMiddleware,
  deleteForMe
);

export default router;
