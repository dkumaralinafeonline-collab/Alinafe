import express from "express";

// 🔐 Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

// 💬 Controllers
import {
  getAllConversations,
  getMessagesForAdmin,
} from "../Controllers/adminMessageController.js";

const router = express.Router();

/* =====================================================
   🔐 ADMIN ACCESS ONLY
===================================================== */
router.use(authMiddleware, roleMiddleware("admin"));

/* =====================================================
   💬 ADMIN CHAT MONITORING
===================================================== */

// ✅ Get all conversations (platform wide)
router.get("/conversations", getAllConversations);

// ✅ Get messages of a specific conversation
router.get("/messages/:conversationId", getMessagesForAdmin);

export default router;
