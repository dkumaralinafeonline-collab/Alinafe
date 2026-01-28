import Category from "../models/Category.js";
import Service from "../models/Service.js";
import SearchLog from "../models/SearchLog.js";
import Ad from "../models/Ad.js";

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokenizeQuery = (q = "") =>
  q
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .filter((t) => t.length >= 2);

const buildTokenAnd = (tokens, field) =>
  tokens.map((t) => ({
    [field]: { $regex: `\\b${t}\\b`, $options: "i" },
  }));

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
    // ADS TITLE SUGGESTIONS
    // -----------------------------
    const tokens = tokenizeQuery(q);
    const ads = tokens.length
      ? await Ad.find({
          status: { $in: ["Approved", "Active"] },
          $and: buildTokenAnd(tokens, "title"),
        })
          .select("title category subcategory")
          .limit(limit)
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
        ads,
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
    let { q = "", location = "", page = 1, limit = 20, sort = "newest" } =
      req.query;

    q = q.trim();
    location = location.trim();
    page = Number(page) || 1;
    limit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (page - 1) * limit;

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
    const tokens = tokenizeQuery(q);
    if (tokens.length) {
      const tokenOr = tokens.join("|");
      filters.$or = [
        { $and: buildTokenAnd(tokens, "title") },
        { $and: buildTokenAnd(tokens, "description") },
        { category: { $regex: `\\b(${tokenOr})\\b`, $options: "i" } },
        { subcategory: { $regex: `\\b(${tokenOr})\\b`, $options: "i" } },
      ];
    }

    // -----------------------------
    // SORTING
    // -----------------------------
    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
      popular: { views: -1, createdAt: -1 },
    };
    const sortBy = sortMap[String(sort).toLowerCase()] || sortMap.newest;

    // -----------------------------
    // FETCH ADS
    // -----------------------------
    const [ads, total] = await Promise.all([
      Ad.find(filters)
        .select(
          "title price images category subcategory city location featured createdAt views"
        )
        .sort(sortBy)
        .skip(skip)
        .limit(limit),
      Ad.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
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
