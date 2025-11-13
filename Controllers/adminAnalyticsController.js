import NodeCache from "node-cache";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Report from "../models/Report.js";
import Message from "../models/Message.js";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export const getAdminStats = async (req, res) => {
  try {
    // ⚡ Check Cache
    const cached = cache.get("admin_overview");
    if (cached) {
      return res.status(200).json({ success: true, source: "cache", ...cached });
    }

    // ⚡ 1. Core Counts
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

    // ⚡ 2. User Growth
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [usersThisMonth, usersLastMonth] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: firstOfThisMonth } }),
      User.countDocuments({ createdAt: { $gte: firstOfLastMonth, $lt: firstOfThisMonth } }),
    ]);

    const userGrowthRate =
      usersLastMonth === 0
        ? 100
        : (((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(2);

    // ⚡ 3. Monthly Trends (6 months)
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

    // ⚡ 4. Ad Status
    const adStatusCount = {
      Approved: approvedAds,
      Pending: pendingAds,
      Rejected: rejectedAds,
      Sold: soldAds,
    };

    // ⚡ 5. Top Insights
    const [topCategoryAgg, topLocationAgg, mostReportedCategoryAgg] = await Promise.all([
      // TOP CATEGORY
      Ad.aggregate([
        { $match: { category: { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      // TOP LOCATION (SAFE)
      Ad.aggregate([
        { $match: { location: { $exists: true, $nin: [null, ""] } } },
        {
          $group: {
            _id: {
              $toLower: {
                $cond: [
                  { $isNumber: "$location" },
                  "",
                  "$location",
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      // MOST REPORTED CATEGORY (SAFE UNWIND)
      Report.aggregate([
        {
          $lookup: {
            from: "ads",
            localField: "adId",
            foreignField: "_id",
            as: "ad",
          },
        },
        {
          $unwind: {
            path: "$ad",
            preserveNullAndEmptyArrays: true,
          },
        },
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
    const topLocation = topLocationAgg[0]?._id || "—";
    const mostReportedCategory = mostReportedCategoryAgg[0]?._id || "—";

    // ⚡ 6. Category Insights (SAFE VERSION)
    const [categorySummary, reportedCategories, engagementByCategory] = await Promise.all([
      Ad.aggregate([
        {
          $group: {
            _id: "$category",
            totalAds: { $sum: 1 },
            avgPrice: { $avg: "$price" },
          },
        },
        { $sort: { totalAds: -1 } },
        { $limit: 8 },
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
        {
          $unwind: {
            path: "$ad",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$ad.category",
            totalReports: { $sum: 1 },
          },
        },
        { $sort: { totalReports: -1 } },
      ]),

      Message.aggregate([
        {
          $match: {
            adId: { $exists: true },
          },
        },
        {
          $lookup: {
            from: "ads",
            localField: "adId",
            foreignField: "_id",
            as: "ad",
          },
        },
        {
          $unwind: {
            path: "$ad",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$ad.category",
            totalMessages: { $sum: 1 },
          },
        },
        { $sort: { totalMessages: -1 } },
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

    // ⚡ 7. User Cities (SAFE)
    const userCities = await User.aggregate([
      { $match: { location: { $exists: true, $nin: [null, ""] } } },
      {
        $group: {
          _id: {
            $toLower: {
              $cond: [
                { $isNumber: "$location" },
                "",
                "$location",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const activeUsers = Math.round(totalUsers * 0.75);
    const inactiveUsers = totalUsers - activeUsers;

    // ⚡ FINAL DATA
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
      lastUpdated: new Date(),
    };

    cache.set("admin_overview", overview);

    return res.status(200).json({ success: true, ...overview });
  } catch (err) {
    console.error("🔥 ADMIN ANALYTICS ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch admin analytics",
    });
  }
};
