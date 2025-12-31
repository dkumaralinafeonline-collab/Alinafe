import express from "express";
import {
  globalSearch,
  getTrendingSearches,
} from "../controllers/searchController.js";

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

/**
 * 🔥 TRENDING SEARCHES
 * GET /api/search/trending?city=&limit=
 */
router.get("/trending", trendingLimiter, getTrendingSearches);

export default router;
