import mongoose from "mongoose";
import User from "../models/User.js";
import Ad from "../models/Ad.js";

/* =====================================================
   ❤️ TOGGLE FAVORITE (ADD / REMOVE)
   🔐 LOGIN REQUIRED
   PUT /api/favorites/toggle
   ➜ JWT BASED (NO userId from client)
===================================================== */
export const toggleFavorite = async (req, res) => {
  try {
    /* ===============================
       🔐 AUTH USER (JWT)
    =============================== */
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userUid = req.user.uid;
    const { adId } = req.body;

    /* ===============================
       🧪 VALIDATION
    =============================== */
    if (!adId) {
      return res.status(400).json({ message: "Ad ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ message: "Invalid ad ID" });
    }

    /* ===============================
       👤 FETCH USER
    =============================== */
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ===============================
       📦 FETCH AD
    =============================== */
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    /* ===============================
       ❤️ TOGGLE FAVORITE
    =============================== */
    const alreadyFavorited = user.favorites.some(
      (fav) => fav.toString() === adId.toString()
    );

    /* ---------- REMOVE ---------- */
    if (alreadyFavorited) {
      user.favorites = user.favorites.filter(
        (fav) => fav.toString() !== adId.toString()
      );

      ad.favouritesCount = Math.max((ad.favouritesCount || 1) - 1, 0);

      await user.save();
      await ad.save();

      return res.status(200).json({
        status: false,
        message: "Removed from favorites",
        favouritesCount: ad.favouritesCount,
      });
    }

    /* ---------- ADD ---------- */
    user.favorites.push(adId);
    ad.favouritesCount = (ad.favouritesCount || 0) + 1;

    await user.save();
    await ad.save();

    return res.status(200).json({
      status: true,
      message: "Added to favorites",
      favouritesCount: ad.favouritesCount,
    });
  } catch (error) {
    console.error("❌ toggleFavorite error:", error);
    return res.status(500).json({
      message: "Server error while toggling favorite",
    });
  }
};

/* =====================================================
   🧾 GET LOGGED-IN USER FAVORITES
   🔐 LOGIN REQUIRED
   GET /api/favorites/:userId
   ➜ userId is URL PARAM but verified via JWT
===================================================== */
export const getFavorites = async (req, res) => {
  try {
    /* ===============================
       🔐 AUTH USER
    =============================== */
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authUid = req.user.uid;
    const { userId } = req.params;

    /* ===============================
       🔒 OWNERSHIP CHECK
    =============================== */
    if (authUid !== userId) {
      return res.status(403).json({
        message: "Access denied: cannot view another user's favorites",
      });
    }

    /* ===============================
       👤 FETCH USER + FAVORITES
    =============================== */
    const user = await User.findOne({ uid: authUid }).populate({
      path: "favorites",
      options: { sort: { createdAt: -1 } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.favorites || []);
  } catch (error) {
    console.error("❌ getFavorites error:", error);
    return res.status(500).json({
      message: "Server error while fetching favorites",
    });
  }
};
