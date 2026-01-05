import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import authMiddleware from "../middlewares/authMiddleware.js";
import cloudinary from "../config/cloudinary.js";

import {
  createReport,
  getUserReports,
} from "../Controllers/report.user.controller.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: { 
    folder: "Zitheke_Reports",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  },
});

const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("file"), createReport);
router.get("/user/:userId", authMiddleware, getUserReports);

export default router;
