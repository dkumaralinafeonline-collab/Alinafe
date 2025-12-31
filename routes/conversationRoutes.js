import express from "express";

// 🔐 AUTH
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  getUserConversations,
  getConversationPreview,
  markConversationRead,
  startConversation,
  deleteConversationHard,
} from "../Controllers/conversationController.js";

const router = express.Router();

/* =====================================================
   🟢 START / GET CONVERSATION
   (USER MUST BE LOGGED IN)
===================================================== */
router.post("/start", authMiddleware, startConversation);

/* =====================================================
   🟢 DASHBOARD CHAT PREVIEW
   GET /api/conversations/preview/:uid
===================================================== */
router.get("/preview/:uid", authMiddleware, getConversationPreview);

/* =====================================================
   🟢 FULL CONVERSATION LIST
   GET /api/conversations/:uid
===================================================== */
router.get("/:uid", authMiddleware, getUserConversations);

/* =====================================================
   🟢 MARK CONVERSATION AS READ
===================================================== */
router.put(
  "/:conversationId/mark-read/:userId",
  authMiddleware,
  markConversationRead
);

/* =====================================================
   🟢 HARD DELETE CONVERSATION
===================================================== */
router.delete(
  "/delete/:conversationId",
  authMiddleware,
  deleteConversationHard
);

export default router;
