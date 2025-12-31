import express from "express";
import { getPublicSellerAds } from "../Controllers/publicSellerController.js";

const router = express.Router();

/* =====================================================
   🌍 PUBLIC SELLER ROUTES
===================================================== */

/* =====================================================
   🏪 GET SELLER ADS (PUBLIC)
   GET /api/public/sellers/:sellerId/ads
===================================================== */
router.get("/:sellerId/ads", (req, res, next) => {
  const { sellerId } = req.params;

  if (!sellerId || typeof sellerId !== "string") {
    return res.status(400).json({ message: "Invalid seller id" });
  }

  next();
}, getPublicSellerAds);

export default router;
