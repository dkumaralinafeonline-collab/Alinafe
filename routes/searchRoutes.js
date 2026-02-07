import express from "express";
import {
  globalSearch,
  getTrendingSearches,
  getAds,
} from "../Controllers/searchController.js";

import {
  searchLimiter,
  trendingLimiter,
} from "../middlewares/rateLimit.js";

const router = express.Router();

/**
 * 🔍 GLOBAL SEARCH (SUGGESTIONS ONLY)
 * GET /api/search?q=&location=&limit=
 * Used for:
 * - category suggestions
 * - service suggestions
 * - trending logs
 */
router.get("/", searchLimiter, globalSearch);
router.get("/ads", searchLimiter, getAds);

/**
 * 🔥 TRENDING SEARCHES
 * GET /api/search/trending?city=&limit=
 */
router.get("/trending", trendingLimiter, getTrendingSearches);

export default router;
