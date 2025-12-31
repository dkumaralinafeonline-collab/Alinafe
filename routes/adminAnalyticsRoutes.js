import express from "express";

// 🔐 Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

// 📊 Controller
import { getAdminStats } from "../Controllers/adminAnalyticsController.js";

const router = express.Router();

/* =====================================================
   🔐 ADMIN ACCESS ONLY
===================================================== */
router.use(authMiddleware, roleMiddleware("admin"));

/* =====================================================
   📊 ADMIN ANALYTICS / OVERVIEW
===================================================== */
router.get("/overview", getAdminStats);

export default router;
