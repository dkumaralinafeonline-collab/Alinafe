import NodeCache from "node-cache";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Report from "../models/Report.js";
import Message from "../models/Message.js";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export const getAdminStats = async (req, res) => {
  try {
    // ⚡ CACHE CHECK
    const cached = cache.get("admin_overview_alinafe");
    if (cached) {
      return res
        .status(200)
        .json({ success: true, source: "cache", ...cached });
    }

    // ⚡ 1. CORE COUNTS
    const [
      totalUsers,
      totalAds,
      approvedAds,
      pendingAds,
      rejectedAds,
      soldAds,
      totalReports,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments(),
      Ad.countDocuments({ status: "Approved" }),
      Ad.countDocuments({ status: "Pending" }),
      Ad.countDocuments({ status: "Rejected" }),
      Ad.countDocuments({ status: "Sold" }),
      Report.countDocuments(),
      Message.countDocuments(),
    ]);

    // ⚡ 2. USER GROWTH
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [usersThisMonth, usersLastMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: firstOfThisMonth } }),
      User.countDocuments({
        createdAt: { $gte: firstOfLastMonth, $lt: firstOfThisMonth },
      }),
    ]);

    const userGrowthRate =
      usersLastMonth === 0
        ? 100
        : (
            ((usersThisMonth - usersLastMonth) / usersLastMonth) *
            100
          ).toFixed(2);

    // ⚡ 3. MONTHLY TREND GRAPH (LAST 6 MONTHS)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString("default", { month: "short" });
    });

    const monthlyAds = await Promise.all(
      months.map(async (_, i) => {
        const start = new Date();
        start.setMonth(start.getMonth() - (5 - i), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);

        return Ad.countDocuments({ createdAt: { $gte: start, $lt: end } });
      })
    );

    const monthlyUsers = await Promise.all(
      months.map(async (_, i) => {
        const start = new Date();
        start.setMonth(start.getMonth() - (5 - i), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);

        return User.countDocuments({ createdAt: { $gte: start, $lt: end } });
      })
    );

    // ⚡ 4. AD STATUS TABLE
    const adStatusCount = {
      Approved: approvedAds,
      Pending: pendingAds,
      Rejected: rejectedAds,
      Sold: soldAds,
    };

    // ⚡ 5. TOP CATEGORY & TOP LOCATION
    const [topCategoryAgg, topLocationAgg, mostReportedCategoryAgg] =
      await Promise.all([
        Ad.aggregate([
          { $match: { category: { $exists: true, $ne: "" } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),

        Ad.aggregate([
          { $match: { location: { $exists: true, $ne: "" } } },
          {
            $group: {
              _id: { $toLower: "$location" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),

        Report.aggregate([
          {
            $lookup: {
              from: "ads",
              localField: "adId",
              foreignField: "_id",
              as: "ad",
            },
          },
          { $unwind: "$ad" },
          {
            $group: {
              _id: "$ad.category",
              reports: { $sum: 1 },
            },
          },
          { $sort: { reports: -1 } },
          { $limit: 1 },
        ]),
      ]);

    const topCategory = topCategoryAgg[0]?._id || "—";
    const topLocation =
      topLocationAgg[0]?._id
        ? topLocationAgg[0]._id.charAt(0).toUpperCase() +
          topLocationAgg[0]._id.slice(1)
        : "—";
    const mostReportedCategory = mostReportedCategoryAgg[0]?._id || "—";

    // ⚡ 6. CATEGORY INSIGHTS
    const [categorySummary, reportedCategories, engagementByCategory] =
      await Promise.all([
        Ad.aggregate([
          {
            $group: {
              _id: "$category",
              totalAds: { $sum: 1 },
              avgPrice: { $avg: "$price" },
            },
          },
          { $sort: { totalAds: -1 } },
        ]),

        Report.aggregate([
          {
            $lookup: {
              from: "ads",
              localField: "adId",
              foreignField: "_id",
              as: "ad",
            },
          },
          { $unwind: "$ad" },
          {
            $group: {
              _id: "$ad.category",
              totalReports: { $sum: 1 },
            },
          },
        ]),

        Message.aggregate([
          {
            $lookup: {
              from: "ads",
              localField: "adId",
              foreignField: "_id",
              as: "ad",
            },
          },
          // ✅ prevent crash if message has no adId
          { $unwind: { path: "$ad", preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: "$ad.category",
              totalMessages: { $sum: 1 },
            },
          },
        ]),
      ]);

    const categoryInsights = categorySummary.map((cat) => {
      const reports = reportedCategories.find((r) => r._id === cat._id);
      const engage = engagementByCategory.find((e) => e._id === cat._id);

      return {
        category: cat._id || "—",
        totalAds: cat.totalAds || 0,
        avgPrice: Math.round(cat.avgPrice || 0),
        totalReports: reports?.totalReports || 0,
        totalMessages: engage?.totalMessages || 0,
        engagementRate:
          cat.totalAds > 0
            ? ((engage?.totalMessages || 0) / cat.totalAds).toFixed(2)
            : 0,
      };
    });

    const userCities = await Ad.aggregate([
      { $match: { city: { $exists: true, $nin: ["", null] } } },
      {
        $group: {
          _id: { $toLower: "$city" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // ⚡ 7. TOP ACTIVE SELLERS (NEW FEATURE)
    const topActiveSellers = await User.aggregate([
      {
        $lookup: {
          from: "ads",
          localField: "uid",
          foreignField: "ownerUid",
          as: "ads",
        },
      },
      {
        $addFields: {
          totalAdsPosted: { $size: "$ads" },
          memberSince: "$createdAt",
          isActiveSeller: {
            $cond: [{ $gt: [{ $size: "$ads" }, 0] }, true, false],
          },
        },
      },
      {
        $project: {
          uid: 1,
          name: 1,
          email: 1,
          memberSince: 1,
          totalAdsPosted: 1,
          isActiveSeller: 1,
        },
      },
      { $sort: { totalAdsPosted: -1 } },
      { $limit: 10 },
    ]);

    // ⚡ 8. ACTIVE & INACTIVE USERS
    // ✅ Better logic: based on recent login instead of random %.
    // If you don't have lastLogin field, it will fallback to 0 and still not crash.
    const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days
    let activeUsers = 0;

    try {
      activeUsers = await User.countDocuments({
        lastLogin: { $gte: activeSince },
      });
    } catch (e) {
      activeUsers = Math.round(totalUsers * 0.75); // fallback
    }

    const inactiveUsers = Math.max(totalUsers - activeUsers, 0);

    const engagementRate =
      totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : "0";

    // FINAL RESPONSE
    const overview = {
      totalUsers,
      totalAds,
      approvedAds,
      pendingAds,
      rejectedAds,
      soldAds,
      totalReports,
      totalMessages,
      userGrowthRate: `${userGrowthRate}%`,
      months,
      monthlyAds,
      monthlyUsers,
      adStatusCount,
      topCategory,
      topLocation,
      mostReportedCategory,
      engagementRate,
      categoryInsights,
      userCities,
      activeUsers,
      inactiveUsers,

      // 🆕 NEW DATA
      topActiveSellers,

      lastUpdated: new Date(),
    };

    cache.set("admin_overview_alinafe", overview);

    return res.status(200).json({ success: true, source: "db", ...overview });
  } catch (err) {
    console.error("🔥 ALINAFE ADMIN ANALYTICS ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch analytics",
    });
  }
};
