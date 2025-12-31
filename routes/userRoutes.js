import express from "express";

// 🔐 AUTH MIDDLEWARE
import authMiddleware from "../middlewares/authMiddleware.js";

// 👤 CONTROLLERS
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
} from "../Controllers/userController.js";

const router = express.Router();

/* =====================================================
   🧾 REGISTER / SYNC USER (PUBLIC)
   ❌ authMiddleware YAHAN NAHI AAYEGA
===================================================== */
router.post(
  "/register",
  registerUser
);

/* =====================================================
   👤 GET USER PROFILE (PRIVATE)
===================================================== */
router.get(
  "/:uid",
  authMiddleware,
  getUserProfile
);

/* =====================================================
   ✏️ UPDATE USER PROFILE (PRIVATE)
===================================================== */
router.put(
  "/:uid",
  authMiddleware,
  updateUserProfile
);

export default router;
