import express from "express";
import { getAdminStats } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

// ✅ Unified Admin Overview Route (with Category Insights)
router.get("/overview", getAdminStats);

export default router;
