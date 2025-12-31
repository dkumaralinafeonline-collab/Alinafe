import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  // 👤 USERS
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,

  // 📦 ADS
  getAllAds,
  getAdById,
  approveAd,
  rejectAd,
  deleteAdByAdmin,
  getAdsStats,
} from "../Controllers/adminController.js";

import { getAdminStats } from "../Controllers/adminOverview.controller.js";

const router = express.Router();

/* ======================
   ADMIN OVERVIEW
====================== */
router.get("/overview", authMiddleware, getAdminStats);

/* ======================
   ADMIN USERS
====================== */
router.get("/users", authMiddleware, getAllUsers);
router.get("/users/:id", authMiddleware, getUserDetails);
router.put("/users/:id/ban", authMiddleware, banUser);
router.put("/users/:id/unban", authMiddleware, unbanUser);

/* ======================
   ADMIN ADS  🔥 (MISSING PART)
====================== */
router.get("/ads", authMiddleware, getAllAds);
router.get("/ads/stats/summary", authMiddleware, getAdsStats);

router.get("/ads/:id", authMiddleware, getAdById);
router.patch("/ads/:id/approve", authMiddleware, approveAd);
router.patch("/ads/:id/reject", authMiddleware, rejectAd);
router.delete("/ads/:id", authMiddleware, deleteAdByAdmin);

export default router;
