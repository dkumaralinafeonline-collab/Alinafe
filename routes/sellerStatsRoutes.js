import express from "express";

// 🔐 AUTH
import authMiddleware from "../middlewares/authMiddleware.js";

// 📊 Controller
import { getSellerStats } from "../Controllers/sellerStatsController.js";

const router = express.Router();

/* =====================================================
   📊 SELLER STATS (PRIVATE)
   🔐 LOGIN REQUIRED
===================================================== */

// sellerId = Firebase UID (same as ownerUid in Ads)
router.get(
  "/:sellerId/stats",
  authMiddleware,
  getSellerStats
);

export default router;
