import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";

const router = express.Router();

/* 🔐 ADMIN ONLY */
router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", getAllReports);
router.get("/:id", getReportById);
router.put("/:id", updateReportStatus);
router.delete("/:id", deleteReport);

export default router;
