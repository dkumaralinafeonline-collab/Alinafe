import express from "express";
import multer from "multer";
import {
  createAd,
  getUserAds,
  getAllAds,
  getAdById,
  updateAd,
  deleteAd,
  markAsSold,
  incrementView,
  updateFavoriteCount,
  searchAds,
} from "../Controllers/adController.js";

// 🔹 Cloudinary Integration
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

/* =============================
   🔧 CLOUDINARY CONFIG
============================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =============================
   📦 MULTER STORAGE ON CLOUDINARY
============================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "zitheke_uploads", // folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

/* =============================
        🔹 ROUTES START
============================= */

// 🟢 CREATE New Ad (default Pending status, up to 5 images)
router.post("/create", upload.array("images", 5), createAd);

// 👤 Get Ads created by specific user
router.get("/user/:uid", getUserAds);

// 🟣 Get ALL Ads (optionally filtered by category)
router.get("/", getAllAds);

// 🔍 Get Single Ad by ID
router.get("/:id", getAdById);

// 🔎 Search Ads (query + location)
router.get("/search/ads", searchAds);

// 👁️ Increment View Count
router.put("/:id/view", incrementView);

// ❤️ Update Favorite Count
router.put("/:id/favorite", updateFavoriteCount);

// 💰 Mark Ad as SOLD
router.put("/:id/sold", markAsSold);

// ✏️ Update Ad Details
router.put("/:id", updateAd);

// ❌ Delete Ad
router.delete("/:id", deleteAd);

/* =============================
        🔹 ROUTES END
============================= */

export default router;
