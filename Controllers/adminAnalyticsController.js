// 📁 backend/controllers/adminAnalyticsController.js
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Report from "../models/Report.js";
import Message from "../models/Message.js";

export const getAdminStats = async (req, res) => {
  try {
    // 1️⃣ Total Counts
    const totalUsers = await User.countDocuments();
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: "Approved" });
    const pendingAds = await Ad.countDocuments({ status: "Pending" });
    const totalReports = await Report.countDocuments();
    const messagesCount = await Message.countDocuments();

    // 2️⃣ Prepare date range (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleString("default", { month: "short" });
    });

    // 3️⃣ Monthly Ads
    const monthlyAds = await Promise.all(
      last6Months.map(async (_, i) => {
        const start = new Date();
        start.setMonth(start.getMonth() - (5 - i), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        return await Ad.countDocuments({ createdAt: { $gte: start, $lt: end } });
      })
    );

    // 4️⃣ Monthly Users
    const monthlyUsers = await Promise.all(
      last6Months.map(async (_, i) => {
        const start = new Date();
        start.setMonth(start.getMonth() - (5 - i), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        return await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
      })
    );

    // 5️⃣ Ad Status Distribution
    const statuses = ["Approved", "Pending", "Rejected", "Sold"];
    const adStatusCount = {};
    for (const s of statuses) {
      adStatusCount[s] = await Ad.countDocuments({ status: s });
    }

    // 6️⃣ Top Insights (Category / Location / Reports)
    const topCategoryAgg = await Ad.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const topCategory = topCategoryAgg[0]?._id || "—";

    const topLocationAgg = await Ad.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const topLocation = topLocationAgg[0]?._id || "—";

    const mostReportedCategoryAgg = await Report.aggregate([
      {
        $lookup: {
          from: "ads",
          localField: "adId",
          foreignField: "_id",
          as: "ad",
        },
      },
      { $unwind: "$ad" },
      { $group: { _id: "$ad.category", reports: { $sum: 1 } } },
      { $sort: { reports: -1 } },
      { $limit: 1 },
    ]);
    const mostReportedCategory = mostReportedCategoryAgg[0]?._id || "—";

    // ✅ Final Response
    res.status(200).json({
      success: true,
      totalUsers,
      totalAds,
      activeAds,
      pendingAds,
      totalReports,
      messagesCount,
      months: last6Months,
      monthlyAds,
      monthlyUsers,
      adStatusCount,
      topCategory,
      topLocation,
      mostReportedCategory,
    });
  } catch (err) {
    console.error("❌ Error generating admin analytics:", err);
    res.status(500).json({ error: "Failed to fetch admin analytics" });
  }
};
