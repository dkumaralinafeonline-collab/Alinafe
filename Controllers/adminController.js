import mongoose from "mongoose";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import { v2 as cloudinary } from "cloudinary";
import { EmailService } from "../Services/email.service.js";

/* ==========================================================
   👤 USER MANAGEMENT SECTION
========================================================== */

// ✅ Get All Users (Admin Dashboard)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "name email photoURL location status adsPosted verified role createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      users, // 🔥 FRONTEND EXPECTS THIS
    });
  } catch (error) {
    console.error("❌ Error fetching all users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};


// ✅ Get Single User Full Details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .populate("favorites", "title price category")
      .select("-__v")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({
      message: "Server error while fetching user",
    });
  }
};

// ✅ Ban User
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "Suspended") {
      return res.status(400).json({
        message: "User is already suspended",
      });
    }

    user.status = "Suspended";
    await user.save();

    res.status(200).json({
      message: "User banned successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error banning user:", error);
    res.status(500).json({
      message: "Server error while banning user",
    });
  }
};

// ✅ Unban / Reactivate User
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === "Active") {
      return res.status(400).json({
        message: "User is already active",
      });
    }

    user.status = "Active";
    await user.save();

    res.status(200).json({
      message: "User unbanned successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error unbanning user:", error);
    res.status(500).json({
      message: "Server error while unbanning user",
    });
  }
};

/* ==========================================================
   📦 ADS MANAGEMENT SECTION (ADMIN)
========================================================== */

export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      ads,
    });
  } catch (error) {
    console.error("❌ Error fetching ads:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching ads",
    });
  }
};


// ✅ Get Single Ad
export const getAdById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ad ID" });
    }

    const ad = await Ad.findById(id).lean();
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    res.status(200).json(ad);
  } catch (error) {
    console.error("❌ Error fetching ad:", error);
    res.status(500).json({
      message: "Server error while fetching ad",
    });
  }
};

// ✅ Approve Ad
export const approveAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findByIdAndUpdate(
      id,
      { status: "Approved", reportReason: "" },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (ad.ownerEmail) {
      EmailService.sendTemplate({
        to: ad.ownerEmail,
        template: "AD_APPROVED",
        data: {
          name: ad.ownerName || "there",
          title: ad.title,
        },
      }).catch((err) => {
        console.error("Ad approved email failed:", err?.message || err);
      });
    }

    res.status(200).json({
      message: "Ad approved successfully",
      ad,
    });
  } catch (error) {
    console.error("❌ Error approving ad:", error);
    res.status(500).json({
      message: "Server error while approving ad",
    });
  }
};

// ✅ Reject Ad
export const rejectAd = async (req, res) => {
  try {
    const { reason } = req.body;

    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        reportReason: reason || "No reason provided",
      },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (ad.ownerEmail) {
      EmailService.sendTemplate({
        to: ad.ownerEmail,
        template: "AD_REJECTED",
        data: {
          name: ad.ownerName || "there",
          title: ad.title,
          reason: ad.reportReason || reason || "No reason provided",
        },
      }).catch((err) => {
        console.error("Ad rejected email failed:", err?.message || err);
      });
    }

    res.status(200).json({
      message: "Ad rejected successfully",
      ad,
    });
  } catch (error) {
    console.error("❌ Error rejecting ad:", error);
    res.status(500).json({
      message: "Server error while rejecting ad",
    });
  }
};

// ✅ Delete Ad (with Cloudinary cleanup)
export const deleteAdByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // 🧹 Delete images
    if (Array.isArray(ad.images)) {
      for (const img of ad.images) {
        if (img?.includes("res.cloudinary.com")) {
          const publicId = img.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    // 🧹 Delete video
    if (ad.video?.publicId) {
      await cloudinary.uploader.destroy(ad.video.publicId, {
        resource_type: "video",
      });
    }

    await ad.deleteOne();

    res.status(200).json({
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting ad:", error);
    res.status(500).json({
      message: "Server error while deleting ad",
    });
  }
};

// ✅ Ads Summary Stats
export const getAdsStats = async (req, res) => {
  try {
    const total = await Ad.countDocuments();
    const approved = await Ad.countDocuments({ status: "Approved" });
    const pending = await Ad.countDocuments({ status: "Pending" });
    const rejected = await Ad.countDocuments({ status: "Rejected" });

    return res.status(200).json({
      success: true,
      stats: {
        total,
        approved,
        pending,
        rejected,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching ad stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching ad stats",
    });
  }
};

