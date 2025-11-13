// Controllers/adminController.js
import User from "../models/User.js";
import Ad from "../models/Ad.js";

/* ==========================================================
   👤 USER MANAGEMENT SECTION
========================================================== */

// ✅ Get All Users (for Admin Dashboard)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "name email photoURL location status adsPosted verified role createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Single User Full Details
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("favorites", "title price category")
      .select("-__v");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Ban User
export const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "Suspended";
    await user.save();

    res.status(200).json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Unban / Reactivate User
export const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "Active";
    await user.save();

    res.status(200).json({ message: "User unbanned successfully", user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ==========================================================
   📦 ADS MANAGEMENT SECTION (For Zitheke Admin)
========================================================== */

// ✅ Get All Ads (for Admin Dashboard)
export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Single Ad Details
export const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.status(200).json(ad);
  } catch (error) {
    console.error("Error fetching ad details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Approve Ad
export const approveAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", reportReason: "" },
      { new: true }
    );
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json({ message: "Ad approved successfully", ad });
  } catch (error) {
    console.error("Error approving ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Reject Ad (with Reason)
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
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json({ message: "Ad rejected successfully", ad });
  } catch (error) {
    console.error("Error rejecting ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Ad
export const deleteAdByAdmin = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Ads Summary Stats (for top cards)
export const getAdsStats = async (req, res) => {
  try {
    const total = await Ad.countDocuments();
    const approved = await Ad.countDocuments({ status: "Approved" });
    const pending = await Ad.countDocuments({ status: "Pending" });
    const rejected = await Ad.countDocuments({ status: "Rejected" });

    res.status(200).json({
      total,
      approved,
      pending,
      rejected,
    });
  } catch (error) {
    console.error("Error fetching ad stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
