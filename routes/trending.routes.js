// src/routes/trending.routes.js
import express from "express";
import { getTrendingAds } from "../Controllers/trending.controller.js";
import { validate } from "../middlewares/validate.js";
import { trendingQuerySchema } from "../middlewares/trending.schema.js";

const router = express.Router();

router.get(
  "/",
  validate(trendingQuerySchema, "query"),
  getTrendingAds
);

export default router;
