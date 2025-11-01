import mongoose from "mongoose";
import User from "../models/User.js";
import Ad from "../models/Ad.js";

/* ========================================
   🧡 TOGGLE FAVORITE (Add / Remove)
======================================== */
export const toggleFavorite = async (req, res) => {
  try {
    const { userId, adId } = req.body;

    if (!userId || !adId) {
      return res.status(400).json({ message: "Missing userId or adId" });
    }

    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ message: "Invalid adId" });
    }

    const ad = await Ad.findById(adId);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // ✅ Safe ObjectId comparison
    const index = user.favorites.findIndex(
      (fav) => fav.toString() === adId.toString()
    );

    if (index > -1) {
      // 🔴 Remove favorite
      user.favorites.splice(index, 1);
      ad.favouritesCount = Math.max((ad.favouritesCount || 1) - 1, 0);

      await user.save();
      await ad.save();

      return res.json({
        message: "Removed from favorites",
        status: false,
        favouritesCount: ad.favouritesCount,
      });
    } else {
      // 🟢 Add favorite
      user.favorites.push(adId);
      ad.favouritesCount = (ad.favouritesCount || 0) + 1;

      await user.save();
      await ad.save();

      return res.json({
        message: "Added to favorites",
        status: true,
        favouritesCount: ad.favouritesCount,
      });
    }
  } catch (error) {
    console.error("❌ Error in toggleFavorite:", error);
    res.status(500).json({
      message: "Server error while toggling favorite",
      error: error.message,
    });
  }
};

/* ========================================
   🧾 GET USER FAVORITES
======================================== */
export const getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId)
      return res.status(400).json({ message: "Missing userId parameter" });

    const user = await User.findOne({ uid: userId }).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.favorites || []);
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    res.status(500).json({
      message: "Server error while fetching favorites",
      error: error.message,
    });
  }
};
