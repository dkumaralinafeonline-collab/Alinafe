import express from "express";
import { getTrendingAds } from "../Controllers/trending.controller.js";
import { validate } from "../middlewares/validate.js";
import { trendingQuerySchema } from "../middlewares/trending.schema.js";

const router = express.Router();

/* =====================================================
   🔥 TRENDING ADS (PUBLIC)
   GET /api/trending
===================================================== */
router.get(
  "/",
  validate(trendingQuerySchema, "query"),
  getTrendingAds
);

export default router;
