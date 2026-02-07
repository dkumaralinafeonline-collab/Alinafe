import express from "express";

// 🔐 AUTH
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";

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
router.post("/start", verifyFirebaseToken, startConversation);

/* =====================================================
   🟢 DASHBOARD CHAT PREVIEW
   GET /api/conversations/preview/:uid
===================================================== */
router.get("/preview/:uid", verifyFirebaseToken, getConversationPreview);

/* =====================================================
   🟢 FULL CONVERSATION LIST
   GET /api/conversations/:uid
===================================================== */
router.get("/:uid", verifyFirebaseToken, getUserConversations);

/* =====================================================
   🟢 MARK CONVERSATION AS READ
===================================================== */
router.put(
  "/:conversationId/mark-read/:userId",
  verifyFirebaseToken,
  markConversationRead
);

/* =====================================================
   🟢 HARD DELETE CONVERSATION
===================================================== */
router.delete(
  "/delete/:conversationId",
  verifyFirebaseToken,
  deleteConversationHard
);

export default router;

