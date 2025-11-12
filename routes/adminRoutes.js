// routes/adminRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getAllAds,
  getAdById,
  approveAd,
  rejectAd,
  deleteAdByAdmin,
  getAdsStats,
  getAdminStats,           // 🆕 added
  getAdminConversations,   // 🆕 added
} from "../Controllers/adminController.js";

const router = express.Router();

/* ============================
   📊 DASHBOARD ANALYTICS
============================ */
router.get("/stats", getAdminStats); // ✅ overview dashboard API
router.get("/conversations", getAdminConversations); // ✅ messages section API

/* ============================
   👤 USER MANAGEMENT
============================ */
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);

/* ============================
   📦 ADS MANAGEMENT
============================ */
router.get("/ads", getAllAds);
router.get("/ads/:id", getAdById);
router.patch("/ads/:id/approve", approveAd);
router.patch("/ads/:id/reject", rejectAd);
router.delete("/ads/:id", deleteAdByAdmin);
router.get("/ads/stats/summary", getAdsStats);

export default router;
