import Ad from "../models/Ad.js";
import Category from "../models/Category.js";
import Service from "../models/Service.js";
import SearchLog from "../models/SearchLog.js";

/* =====================================================
   🔍 GLOBAL SEARCH (SUGGESTIONS ONLY)
   GET /api/search
   👉 Used ONLY for autocomplete / suggestions
===================================================== */
export const globalSearch = async (req, res) => {
  try {
    let { q = "", location = "", limit = 8 } = req.query;

    // -----------------------------
    // SANITIZATION
    // -----------------------------
    q = q.trim();
    location = location.trim();
    limit = Number(limit) || 8;
    limit = Math.min(limit, 10);

    // -----------------------------
    // EMPTY QUERY + EMPTY LOCATION
    // -----------------------------
    if (!q && !location) {
      return res.status(200).json({
        success: true,
        suggestions: {
          categories: [],
          services: [],
        },
      });
    }

    // -----------------------------
    // CATEGORY SUGGESTIONS
    // -----------------------------
    const categories = q
      ? await Category.find({
          $or: [
            { name: { $regex: q, $options: "i" } },
            { keywords: { $regex: q, $options: "i" } },
          ],
        })
          .select("name slug")
          .limit(5)
      : [];

    // -----------------------------
    // SERVICE SUGGESTIONS
    // -----------------------------
    const services = q
      ? await Service.find({
          $or: [
            { name: { $regex: q, $options: "i" } },
            { keywords: { $regex: q, $options: "i" } },
          ],
        })
          .select("name category")
          .limit(5)
      : [];

    // -----------------------------
    // SEARCH LOG (TRENDING)
    // -----------------------------
    if (q) {
      await SearchLog.findOneAndUpdate(
        { query: q.toLowerCase(), city: location || "" },
        {
          $inc: { count: 1 },
          $set: { lastSearchedAt: new Date() },
        },
        { upsert: true }
      );
    }

    return res.status(200).json({
      success: true,
      suggestions: {
        categories,
        services,
      },
    });
  } catch (error) {
    console.error("GLOBAL SEARCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

/* =====================================================
   📦 ADS LISTING (REAL SEARCH PAGE)
   GET /api/ads
   👉 Used by /ads page
===================================================== */
export const getAds = async (req, res) => {
  try {
    let { q = "", location = "" } = req.query;

    q = q.trim();
    location = location.trim();

    // -----------------------------
    // BASE FILTER
    // -----------------------------
    const filters = {
      status: { $in: ["Approved", "Active"] },
    };

    // -----------------------------
    // LOCATION FILTER (FIXED)
    // Supports:
    // Mathura
    // mathura
    // Mathura, UP
    // -----------------------------
    if (location) {
      filters.city = {
        $regex: `^${location}`,
        $options: "i",
      };
    }

    // -----------------------------
    // QUERY FILTER (car, bike, service etc)
    // -----------------------------
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { subcategory: { $regex: q, $options: "i" } },
      ];
    }

    // -----------------------------
    // FETCH ADS
    // -----------------------------
    const ads = await Ad.find(filters)
      .select(
        "title price images category subcategory city location featured createdAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });
  } catch (error) {
    console.error("ADS FETCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ads",
    });
  }
};

/* =====================================================
   🔥 TRENDING SEARCHES
   GET /api/search/trending
===================================================== */
export const getTrendingSearches = async (req, res) => {
  try {
    let { city = "", limit = 10 } = req.query;

    city = city.trim();
    limit = Number(limit) || 10;
    limit = Math.min(limit, 15);

    const filter = {};
    if (city) {
      filter.city = city;
    }

    const trending = await SearchLog.find(filter)
      .sort({ count: -1, lastSearchedAt: -1 })
      .limit(limit)
      .select("query count city lastSearchedAt");

    return res.status(200).json({
      success: true,
      city: city || "all",
      trending,
    });
  } catch (error) {
    console.error("TRENDING SEARCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending searches",
    });
  }
};
