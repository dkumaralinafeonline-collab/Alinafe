// Controllers/adminController.js
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Report from "../models/Report.js"; // optional if you store reports
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

/* ==========================================================
   👤 USER MANAGEMENT SECTION
========================================================== */
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
   📦 ADS MANAGEMENT SECTION
========================================================== */
export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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

export const getAdsStats = async (req, res) => {
  try {
    const total = await Ad.countDocuments();
    const approved = await Ad.countDocuments({ status: "Approved" });
    const pending = await Ad.countDocuments({ status: "Pending" });
    const rejected = await Ad.countDocuments({ status: "Rejected" });

    res.status(200).json({ total, approved, pending, rejected });
  } catch (error) {
    console.error("Error fetching ad stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ==========================================================
   📊 DASHBOARD ANALYTICS SECTION (AdminOverview.jsx)
========================================================== */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: "Approved" });
    const pendingAds = await Ad.countDocuments({ status: "Pending" });
    const totalReports = await Report.countDocuments();
    const messagesCount = await Message.countDocuments();

    // Monthly user signups
    const monthlyUsers = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Monthly ads posted
    const monthlyAds = await Ad.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Ad status distribution
    const adStatusData = await Ad.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const adStatusCount = adStatusData.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    // Top category and location
    const topCategory = await Ad.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const topLocation = await Ad.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostReportedCategory = await Report.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    res.status(200).json({
      totalUsers,
      totalAds,
      activeAds,
      pendingAds,
      totalReports,
      messagesCount,
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      monthlyAds: monthlyAds.map((d) => d.count),
      monthlyUsers: monthlyUsers.map((d) => d.count),
      adStatusCount,
      topCategory: topCategory[0]?._id || "N/A",
      topLocation: topLocation[0]?._id || "N/A",
      mostReportedCategory: mostReportedCategory[0]?._id || "N/A",
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

/* ==========================================================
   💬 ADMIN MESSAGE SECTION (Messages.jsx)
========================================================== */
export const getAdminConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate("participants", "name email")
      .populate("lastMessage", "text createdAt sender")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
};
