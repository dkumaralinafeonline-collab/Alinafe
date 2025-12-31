import mongoose from "mongoose";
import Ad from "../models/Ad.js";

const adPermissionMiddleware = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🛑 ObjectId guard (very important)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Ad ID",
      });
    }

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    // 🔐 OWNER OR ADMIN CHECK
    if (
      ad.ownerUid !== req.user.uid &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to perform this action",
      });
    }

    // 🔁 attach ad for controller use
    req.ad = ad;
    next();
  } catch (error) {
    console.error("❌ Ad Permission Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default adPermissionMiddleware;
