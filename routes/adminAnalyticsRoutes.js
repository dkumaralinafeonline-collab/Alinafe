// 📁 backend/routes/adminAnalyticsRoutes.js
import express from "express";
import { getAdminStats } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

// ✅ Admin analytics overview endpoint
router.get("/stats", getAdminStats);

export default router;
