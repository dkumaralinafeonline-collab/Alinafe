import User from "../models/User.js";
import Ad from "../models/Ad.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAds = await Ad.countDocuments();

    res.status(200).json({
      success: true,
      totalUsers,
      totalAds,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load admin stats",
    });
  }
};
