import mongoose from "mongoose";
import Report from "../models/Report.js";

/* =====================================================
   📝 CREATE REPORT
   🔐 LOGIN REQUIRED (USER ONLY)
===================================================== */
export const createReport = async (req, res) => {
  try {
    const {
      adId,
      adTitle,
      sellerId,
      reporterId,
      reporterName,
      reason,
      message,
    } = req.body;

    /* ===============================
       🔐 AUTH + OWNERSHIP CHECK
    =============================== */
    if (!req.user || req.user.uid !== reporterId) {
      return res.status(403).json({
        message: "Access denied: cannot submit report for another user",
      });
    }

    /* ===============================
       🧪 VALIDATION
    =============================== */
    if (!adId || !reporterId || !reason || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ error: "Invalid adId" });
    }

    /* ===============================
       📎 OPTIONAL FILE
    =============================== */
    let fileUrl = "";
    if (req.file && req.file.path) {
      fileUrl = req.file.path;
    }

    /* ===============================
       🧾 CREATE REPORT
    =============================== */
    const newReport = await Report.create({
      adId,
      adTitle,
      sellerId,
      reporterId,
      reporterName,
      reason,
      message,
      fileUrl,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: newReport,
    });
  } catch (err) {
    console.error("❌ Error submitting report:", err);
    return res.status(500).json({ error: "Failed to submit report" });
  }
};

/* =====================================================
   📦 GET ALL REPORTS
   🔐 ADMIN ONLY
===================================================== */
export const getAllReports = async (req, res) => {
  try {
    /* ===============================
       🔐 ROLE CHECK
    =============================== */
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reports = await Report.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      reports,
    });
      } catch (err) {
    console.error("❌ Error fetching reports:", err);
    return res.status(500).json({ error: "Error fetching reports" });
  }
};

/* =====================================================
   👤 GET REPORTS BY USER
   🔐 LOGIN + OWNERSHIP REQUIRED
===================================================== */
export const getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;

    /* ===============================
       🔐 OWNERSHIP CHECK
    =============================== */
    if (!req.user || req.user.uid !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reports = await Report.find({
      reporterId: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(reports);
  } catch (err) {
    console.error("❌ Error fetching user reports:", err);
    return res.status(500).json({ error: "Error fetching user reports" });
  }
};

/* =====================================================
   🔍 GET REPORT BY ID
   🔐 ADMIN ONLY
===================================================== */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    /* ===============================
       🔐 ROLE CHECK
    =============================== */
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await Report.findById(id)
      .populate({
        path: "adId",
        select:
          "title description price location images ownerUid ownerName ownerEmail ownerPhone createdAt",
        strictPopulate: false,
      })
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("❌ Error fetching report by id:", err);
    return res.status(500).json({ error: "Error fetching report" });
  }
};

/* =====================================================
   🔄 UPDATE REPORT STATUS
   🔐 ADMIN ONLY
===================================================== */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    /* ===============================
       🔐 ROLE CHECK
    =============================== */
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      status: updated.status,
    });
  } catch (err) {
    console.error("❌ Error updating report:", err);
    return res.status(500).json({ error: "Failed to update report" });
  }
};

/* =====================================================
   🗑 DELETE REPORT
   🔐 ADMIN ONLY
===================================================== */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    /* ===============================
       🔐 ROLE CHECK
    =============================== */
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting report:", err);
    return res.status(500).json({ error: "Failed to delete report" });
  }
};
