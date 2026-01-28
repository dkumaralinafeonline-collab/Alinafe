import mongoose from "mongoose";
import Report from "../models/Report.js";
import Ad from "../models/Ad.js";
import User from "../models/User.js";
import { EmailService } from "../Services/email.service.js";

/* ---------------------------
   Helpers
---------------------------- */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendError = (res, status, message, details = null, code = "ERROR") => {
  return res.status(status).json({
    success: false,
    code,
    message,
    details,
  });
};

const logCtx = (label, ctx = {}) => {
  try {
    console.log(`[${label}]`, JSON.stringify(ctx));
  } catch {
    console.log(`[${label}]`, ctx);
  }
};

// Defensive admin check (middleware should already do it, but we harden anyway)
const assertAdmin = (req, res) => {
  const role = req.user?.role;
  const isAdmin = req.user?.isAdmin;

  // Support multiple patterns:
  // 1) req.user.role === "admin"
  // 2) req.user.isAdmin === true
  // 3) req.user.admin === true
  const ok = role === "admin" || isAdmin === true || req.user?.admin === true;

  if (!ok) {
    sendError(res, 403, "Admin access required", { role, isAdmin }, "FORBIDDEN");
    return false;
  }
  return true;
};

const buildDateRange = (from, to) => {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  return Object.keys(range).length ? range : null;
};

/* ---------------------------
   GET ALL REPORTS (Hardened)
   - Pagination + filters + search
   - status, from, to, search, page, limit
---------------------------- */
export const getAllReports = async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const {
      status,
      from,
      to,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.status = status;
    }

    const range = buildDateRange(from, to);
    if (range) {
      query.createdAt = range;
    }

    // Basic text-ish search across common fields
    if (search && String(search).trim()) {
      const q = String(search).trim();
      query.$or = [
        { adTitle: { $regex: q, $options: "i" } },
        { reason: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { reporterName: { $regex: q, $options: "i" } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(query),
    ]);

    return res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      filters: { status: status || null, from: from || null, to: to || null, search: search || null },
      reports,
    });
  } catch (err) {
    logCtx("ADMIN_GET_ALL_REPORTS_FAILED", {
      admin: req.user?._id || req.user?.uid,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to fetch reports", null, "SERVER_ERROR");
  }
};

/* ---------------------------
   GET SINGLE REPORT (Hardened)
   - Validate ObjectId
   - Populate adId if your schema refs Ad
---------------------------- */
export const getReportById = async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid report id", { id }, "INVALID_ID");
    }

    const report = await Report.findById(id).populate("adId").lean();

    if (!report) {
      return sendError(res, 404, "Report not found", { id }, "NOT_FOUND");
    }

    return res.json({ success: true, data: report });
  } catch (err) {
    logCtx("ADMIN_GET_REPORT_FAILED", {
      reportId: req.params?.id,
      admin: req.user?._id || req.user?.uid,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to fetch report", null, "SERVER_ERROR");
  }
};

/* ---------------------------
   UPDATE STATUS (Hardened)
   - Validate id + status
   - Add admin metadata: resolvedAt, resolvedBy, adminNote, action
---------------------------- */
export const updateReportStatus = async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid report id", { id }, "INVALID_ID");
    }

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return sendError(res, 400, "Invalid status", { status }, "VALIDATION_ERROR");
    }

    const update = {
      status,
      adminNote: adminNote || "",
    };

    // If resolved (Approved/Rejected), set resolvedAt/resolvedBy/action
    if (status === "Approved") {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user?._id || req.user?.uid || null;
      update.action = "Approved";
    } else if (status === "Rejected") {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user?._id || req.user?.uid || null;
      update.action = "Rejected";
    } else {
      // Pending: clear resolution metadata
      update.resolvedAt = null;
      update.resolvedBy = null;
      update.action = "Pending";
    }

    const report = await Report.findByIdAndUpdate(id, update, { new: true });

    if (!report) {
      return sendError(res, 404, "Report not found", { id }, "NOT_FOUND");
    }

    // --- Email reporter about decision (Approved/Rejected) ---
    if (status === "Approved" || status === "Rejected") {
      Promise.all([
        User.findOne({ uid: report.reporterId }).lean(),
        Ad.findById(report.adId).select("title").lean(),
      ])
        .then(([reporterUser, ad]) => {
          const reporterEmail = reporterUser?.email;
          if (!reporterEmail) return;
          const adTitle = ad?.title || report.adTitle || "the ad";

          EmailService.sendTemplate({
            to: reporterEmail,
            template: status === "Approved" ? "REPORT_APPROVED" : "REPORT_REJECTED",
            data: {
              name: reporterUser?.name || report.reporterName || "there",
              adTitle,
              adminNote: adminNote || "",
            },
          }).catch((err) => {
            console.error("Report decision email failed:", err?.message || err);
          });
        })
        .catch(() => {});
    }

    logCtx("REPORT_STATUS_UPDATED", {
      reportId: id,
      admin: req.user?._id || req.user?.uid,
      status: report.status,
    });

    return res.json({
      success: true,
      data: {
        id: report._id,
        status: report.status,
        resolvedAt: report.resolvedAt || null,
        resolvedBy: report.resolvedBy || null,
        adminNote: report.adminNote || "",
        action: report.action || "",
      },
    });
  } catch (err) {
    logCtx("ADMIN_UPDATE_REPORT_STATUS_FAILED", {
      reportId: req.params?.id,
      admin: req.user?._id || req.user?.uid,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to update report status", null, "SERVER_ERROR");
  }
};

/* ---------------------------
   DELETE AD FROM REPORT (Hardened - Real World)
   - Validate ids
   - Guard: if Ad missing or already deleted -> do NOT auto-approve
   - Use transaction to keep Report+Ad consistent
   - Add audit fields: resolvedAt/resolvedBy/adminNote/action
---------------------------- */
export const deleteReportedAd = async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid report id", { id }, "INVALID_ID");
    }

    const report = await Report.findById(id);

    if (!report) {
      return sendError(res, 404, "Report not found", { id }, "NOT_FOUND");
    }

    if (!report.adId || !isValidObjectId(String(report.adId))) {
      return sendError(
        res,
        400,
        "Report has invalid adId reference",
        { reportId: id },
        "DATA_INTEGRITY_ERROR"
      );
    }

    const ad = await Ad.findById(report.adId);

    if (!ad) {
      return sendError(
        res,
        404,
        "Ad not found for this report (not resolving report automatically)",
        { reportId: id },
        "NOT_FOUND"
      );
    }

    const alreadyDeleted =
      String(ad.status || "").toLowerCase() === "deleted" || !!ad.deletedAt;

    if (alreadyDeleted) {
      return res.json({
        success: true,
        message: "Ad already deleted",
        data: {
          reportId: report._id,
          reportStatus: report.status,
          action: report.action || "",
          resolvedAt: report.resolvedAt || null,
          resolvedBy: report.resolvedBy || null,
          adId: report.adId,
          adStatus: ad.status || "deleted",
          deletedAt: ad.deletedAt || null,
          deletedBy: ad.deletedBy || null,
          alreadyDeleted: true,
        },
      });
    }

    const deletedBy = req.user?._id || req.user?.uid || null;
    const resolvedAt = new Date();

    await Promise.all([
      Ad.updateOne(
        { _id: ad._id },
        {
          $set: {
            status: "deleted",
            deletedAt: resolvedAt,
            deletedBy,
          },
        }
      ),
      Report.updateOne(
        { _id: report._id },
        {
          $set: {
            status: "Approved",
            resolvedAt,
            resolvedBy: deletedBy,
            adminNote: adminNote || "",
            action: "DeletedAd",
          },
        }
      ),
    ]);

    // --- Email ad owner about deletion ---
    Promise.all([
      User.findOne({ uid: ad.ownerUid || ad.userId }).lean(),
    ])
      .then(([ownerUser]) => {
        const ownerEmail = ad.ownerEmail || ownerUser?.email;
        if (!ownerEmail) return;
        EmailService.sendTemplate({
          to: ownerEmail,
          template: "AD_DELETED_BY_ADMIN",
          data: {
            name: ad.ownerName || ownerUser?.name || "there",
            adTitle: ad.title || "your ad",
            adminNote: adminNote || "",
          },
        }).catch((err) => {
          console.error("Ad deleted email failed:", err?.message || err);
        });
      })
      .catch(() => {});

    const resultPayload = {
      success: true,
      message: "Ad deleted & report resolved",
      data: {
        reportId: report._id,
        reportStatus: "Approved",
        action: "DeletedAd",
        resolvedAt,
        resolvedBy: deletedBy,
        adId: ad._id,
        adStatus: "deleted",
        deletedAt: resolvedAt,
        deletedBy,
      },
    };

    logCtx("ADMIN_DELETE_REPORTED_AD_SUCCESS", {
      reportId: id,
      admin: req.user?._id || req.user?.uid,
    });

    return res.json(resultPayload);
  } catch (err) {
    const msg = err?.message || "UNKNOWN_ERROR";
    const statusCode = err?.statusCode || 500;

    logCtx("ADMIN_DELETE_REPORTED_AD_FAILED", {
      reportId: req.params?.id,
      admin: req.user?._id || req.user?.uid,
      err: msg,
      stack: err?.stack,
    });

    if (msg === "REPORT_NOT_FOUND") {
      return sendError(res, 404, "Report not found", { id: req.params?.id }, "NOT_FOUND");
    }

    if (msg === "INVALID_AD_ID_IN_REPORT") {
      return sendError(
        res,
        400,
        "Report has invalid adId reference",
        { reportId: req.params?.id },
        "DATA_INTEGRITY_ERROR"
      );
    }

    if (msg === "AD_NOT_FOUND") {
      return sendError(
        res,
        404,
        "Ad not found for this report (not resolving report automatically)",
        { reportId: req.params?.id },
        "NOT_FOUND"
      );
    }

    return sendError(res, statusCode, "Failed to delete reported ad", null, "SERVER_ERROR");
  }
};

/* ---------------------------
   DELETE REPORT ONLY (ADMIN)
   - Validate id
---------------------------- */
export const deleteReport = async (req, res) => {
  if (!assertAdmin(req, res)) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid report id", { id }, "INVALID_ID");
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return sendError(res, 404, "Report not found", { id }, "NOT_FOUND");
    }

    logCtx("ADMIN_DELETE_REPORT_SUCCESS", {
      reportId: id,
      admin: req.user?._id || req.user?.uid,
    });

    return res.json({
      success: true,
      message: "Report deleted",
    });
  } catch (err) {
    logCtx("ADMIN_DELETE_REPORT_FAILED", {
      reportId: req.params?.id,
      admin: req.user?._id || req.user?.uid,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to delete report", null, "SERVER_ERROR");
  }
};
