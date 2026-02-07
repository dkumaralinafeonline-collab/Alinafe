import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import verifyFirebaseToken from "../middlewares/verifyFirebaseToken.js";
import cloudinary from "../config/cloudinary.js";
import multerErrorHandler from "../middlewares/multerErrorHandler.js";

import {
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateUserPhoto,
  logoutUser,
  sendEmailOtp,
  verifyEmailOtp,
  setUserPassword,
  updateUserPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
  resolveLoginIdentifier,
} from "../Controllers/userController.js";

const router = express.Router();

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "alinafe/users",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  },
});

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/register", verifyFirebaseToken, registerUser);
router.post("/logout", verifyFirebaseToken, logoutUser);
router.post("/login/resolve", resolveLoginIdentifier);

router.post("/email/send-otp", verifyFirebaseToken, sendEmailOtp);
router.post("/email/verify-otp", verifyFirebaseToken, verifyEmailOtp);

router.post("/password/set", verifyFirebaseToken, setUserPassword);
router.post("/password/update", verifyFirebaseToken, updateUserPassword);
router.post("/password/send-otp", verifyFirebaseToken, sendPasswordResetOtp);
router.post("/password/verify-otp", verifyFirebaseToken, verifyPasswordResetOtp);
router.post("/password/reset", verifyFirebaseToken, resetPasswordWithOtp);

router.get("/me", verifyFirebaseToken, getUserProfile);
router.put("/me", verifyFirebaseToken, updateUserProfile);
router.put(
  "/me/photo",
  verifyFirebaseToken,
  upload.single("photo"),
  multerErrorHandler,
  updateUserPhoto
);

export default router;
