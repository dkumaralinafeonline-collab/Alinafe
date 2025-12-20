import express from "express";
import { getSellerStats } from "../controllers/sellerStatsController.js";

const router = express.Router();

// ✅ sellerId = Firebase UID (same as ownerUid in Ads)
router.get("/:sellerId/stats", getSellerStats);

export default router;
