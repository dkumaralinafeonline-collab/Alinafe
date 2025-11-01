import express from "express";
import { toggleFavorite, getFavorites } from "../Controllers/favoriteController.js";

const router = express.Router();

// 🟢 Toggle favorite (add/remove)
router.put("/toggle", toggleFavorite);

// 🟣 Get user's favorites list
router.get("/:userId", getFavorites);

export default router;
