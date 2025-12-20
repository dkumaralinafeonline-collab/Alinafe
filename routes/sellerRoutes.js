import express from "express";
import { getSellerAds } from "../Controllers/sellerController.js";

const router = express.Router();

// 🔥 Seller specific ads
router.get("/:sellerId/ads", getSellerAds);

export default router;
