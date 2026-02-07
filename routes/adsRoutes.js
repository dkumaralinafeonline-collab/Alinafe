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
  getPromoAds,

} from "../Controllers/adController.js";

// 🔐 AUTH MIDDLEWARE
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";

// 🔐 OWNER / ADMIN PERMISSION MIDDLEWARE
import adPermissionMiddleware from "../middlewares/adPermissionMiddleware.js";

// 🔹 Cloudinary Integration
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// 🔥 Multer Error Handler
import multerErrorHandler from "../middlewares/multerErrorHandler.js";

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
   📦 CLOUDINARY STORAGE
============================= */
const storage = new CloudinaryStorage({
  
  cloudinary,
  params: async (req, file) => {
    // 🎥 VIDEO CONFIG
    if (file.mimetype.startsWith("video")) {
      return {
        folder: "alinafe/videos",
        resource_type: "video",
        allowed_formats: ["mp4", "webm", "mov"],
      };
    }

    // 🖼️ IMAGE CONFIG
    return {
      folder: "alinafe/images",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

/* =============================
   📤 MULTER CONFIG
============================= */
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // ⛔ 30MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

/* =============================
        🔹 ROUTES START
============================= */

/* =================================================
   🟢 CREATE AD (LOGIN REQUIRED)
================================================= */
router.post(
  "/create",
  verifyFirebaseToken,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  multerErrorHandler,
  createAd
);

/* =================================================
   👤 GET LOGGED-IN USER ADS
================================================= */
router.get("/user/:uid", verifyFirebaseToken, getUserAds);

/* =================================================
   🔎 SEARCH ADS (PUBLIC)
================================================= */
router.get("/search/ads", searchAds);

/* =================================================
   ⭐ GET PROMO ADS (HOMEPAGE / SECTIONS)
   - Public
   - Lightweight
================================================= */
router.get("/promo", getPromoAds);

/* =================================================
   🌍 GET ALL APPROVED ADS (PUBLIC)
================================================= */
router.get("/", getAllAds);

/* =================================================
   👁️ INCREMENT VIEW COUNT (PUBLIC)
================================================= */
router.put("/:id/view", incrementView);

/* =================================================
   ❤️ UPDATE FAVORITE COUNT (LOGIN)
================================================= */
router.put(
  "/:id/favorite",
  verifyFirebaseToken,
  updateFavoriteCount
);

/* =================================================
   💰 MARK AD AS SOLD (OWNER / ADMIN)
================================================= */
router.put(
  "/:id/sold",
  verifyFirebaseToken,
  adPermissionMiddleware,
  markAsSold
);

/* =================================================
   ✏️ UPDATE AD (OWNER / ADMIN)
================================================= */
router.put(
  "/:id",
  verifyFirebaseToken,
  adPermissionMiddleware,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  multerErrorHandler,
  updateAd
);

/* =================================================
   ❌ DELETE AD (OWNER / ADMIN)
================================================= */
router.delete(
  "/:id",
  verifyFirebaseToken,
  adPermissionMiddleware,
  deleteAd
);

/* =================================================
   🟣 GET SINGLE AD BY ID (PUBLIC)
   🔒 REGEX GUARD — ALWAYS LAST
================================================= */
router.get("/:id", getAdById);


/* =============================
        🔹 ROUTES END
============================= */

export default router;

