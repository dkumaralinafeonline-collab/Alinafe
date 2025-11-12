// src/routes/reportRoutes.js
import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import Report from "../models/Report.js"; // ✅ Required for inline update/delete
import {
  createReport,
  getAllReports,
  getUserReports,
  getReportById,
} from "../controllers/reportController.js";

const router = express.Router();

/* ================================
   ☁️ Cloudinary Storage Config
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Zitheke_Reports",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  },
});
const upload = multer({ storage });

/* ================================
   🧩 REPORT ROUTES
================================ */

// ✅ Create a new report
router.post("/", upload.single("file"), createReport);

// ✅ Get all reports (for admin)
router.get("/", getAllReports);

// ✅ Get reports of specific user
router.get("/user/:userId", getUserReports);

// ✅ Get one report (for admin detailed view)
router.get("/:id", getReportById);

// ✅ Update report status (Approve / Reject)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: "Report status updated successfully",
      status: updated.status,
    });
  } catch (err) {
    console.error("❌ Error updating report:", err);
    res.status(500).json({ error: "Failed to update report status" });
  }
});

// ✅ Delete a report
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting report:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

export default router;
