import express from "express";
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";

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
  verifyFirebaseToken,
  getMessagesByConversation
);

/* ============================================================
   🔹 SEND MESSAGE (TEXT / MEDIA)
============================================================ */
router.post(
  "/",
  verifyFirebaseToken,
  saveMessage
);

/* ============================================================
   🔹 DELETE MESSAGE FOR EVERYONE
   (Sender only — controller validates)
============================================================ */
router.put(
  "/delete-everyone/:messageId",
  verifyFirebaseToken,
  deleteForEveryone
);

/* ============================================================
   🔹 DELETE MESSAGE FOR ME ONLY
============================================================ */
router.put(
  "/delete-me/:messageId",
  verifyFirebaseToken,
  deleteForMe
);

export default router;

