import express from "express";
import mongoose from "mongoose";

// 🔐 AUTH
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";

// 📦 Controller
import { getSellerAds } from "../Controllers/sellerController.js";

const router = express.Router();

/* =====================================================
   🏪 SELLER ADS ROUTES
   🔐 LOGIN REQUIRED
===================================================== */

/* =====================================================
   🔥 GET SELLER ADS (PRIVATE)
   GET /api/sellers/:sellerId/ads
   - Seller himself OR Admin only
===================================================== */
router.get(
  "/:sellerId/ads",
  verifyFirebaseToken,
  (req, res, next) => {
    const { sellerId } = req.params;

    // 🛡️ Basic validation
    if (!sellerId || typeof sellerId !== "string") {
      return res.status(400).json({ message: "Invalid seller id" });
    }

    next();
  },
  getSellerAds
);

export default router;

