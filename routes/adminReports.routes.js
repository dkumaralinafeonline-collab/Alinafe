import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReportedAd,
  deleteReport,
} from "../Controllers/report.admin.controller.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", getAllReports);
router.get("/:id", getReportById);
router.put("/:id/status", updateReportStatus);
router.delete("/:id/delete-ad", deleteReportedAd);
router.delete("/:id", deleteReport);

export default router;
