import express from "express";
import {
  registerUser,
  getUserProfile,
  updateUserProfile,
} from "../Controllers/userController.js";

const router = express.Router();

// Register / Sync Firebase User
router.post("/register", registerUser);

// Get Profile by Firebase UID
router.get("/:uid", getUserProfile);

// Update Profile
router.put("/:uid", updateUserProfile);

export default router;
