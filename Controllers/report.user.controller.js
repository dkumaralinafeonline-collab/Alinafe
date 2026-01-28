import mongoose from "mongoose";
import Report from "../models/Report.js";
import Ad from "../models/Ad.js";
import User from "../models/User.js";
import { EmailService } from "../Services/email.service.js";

/* ---------------------------
   Helpers (Consistent Errors)
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
  // Minimal structured logging (you can replace with Winston/Pino later)
  try {
    console.log(`[${label}]`, JSON.stringify(ctx));
  } catch {
    console.log(`[${label}]`, ctx);
  }
};

const getReporterIdFromAuth = (req) => req.user?.uid || null;

/* ---------------------------
   Anti-spam / Dedupe Settings
---------------------------- */
const REPORT_COOLDOWN_HOURS = 24;

/* ---------------------------
   CREATE REPORT (Hardened)
   - Derive adTitle & sellerId from DB (Ad)
   - Validate ObjectIds early
   - Dedupe / cooldown
   - Never trust reporterId from client
---------------------------- */
export const createReport = async (req, res) => {
  const reporterId = getReporterIdFromAuth(req);

  try {
    const { adId, reporterName, reason, message } = req.body;

    if (!reporterId) {
      return sendError(res, 401, "Unauthorized", null, "UNAUTHORIZED");
    }

    if (!adId || !reason || !message) {
      return sendError(res, 400, "Missing fields", { adId, reason, message }, "VALIDATION_ERROR");
    }

    if (!isValidObjectId(adId)) {
      return sendError(res, 400, "Invalid adId", { adId }, "INVALID_ID");
    }

    // ✅ Always load Ad from DB and derive fields server-side
    const ad = await Ad.findById(adId)
      .select("_id title ownerUid userId status deletedAt ownerEmail ownerName")
      .lean();

    if (!ad) {
      return sendError(res, 404, "Ad not found", { adId }, "NOT_FOUND");
    }

    // Optional: block reporting already deleted content (adjust if you want)
    if (String(ad.status || "").toLowerCase() === "deleted" || ad.deletedAt) {
      return sendError(res, 409, "This ad is already deleted", { adId }, "CONFLICT");
    }

    const derivedAdTitle = ad.title || "Untitled Ad";
    const derivedSellerId = ad.ownerUid || ad.userId; // prefer ownerUid, fallback to userId

    // ✅ Dedupe / cooldown check: same reporter cannot spam same ad repeatedly
    const cooldownSince = new Date(Date.now() - REPORT_COOLDOWN_HOURS * 60 * 60 * 1000);

    const existing = await Report.findOne({
      reporterId,
      adId,
      createdAt: { $gte: cooldownSince },
    })
      .select("_id createdAt status")
      .lean();

    if (existing) {
      return sendError(
        res,
        429,
        `You already reported this ad recently. Try again after ${REPORT_COOLDOWN_HOURS} hours.`,
        { reportId: existing._id, createdAt: existing.createdAt, status: existing.status },
        "RATE_LIMIT"
      );
    }

    const fileUrl = req.file?.path || "";

    const payload = {
      adId,
      adTitle: derivedAdTitle,
      sellerId: derivedSellerId,
      reporterId, // ✅ from auth only
      reporterName: reporterName || "Anonymous",
      reason,
      message,
      fileUrl,

      // ✅ Audit baseline (future-proof). These fields must exist in schema to persist.
      status: "Pending",
    };

    const report = await Report.create(payload);

    // --- Email notifications (non-blocking) ---
    Promise.all([
      User.findOne({ uid: derivedSellerId }).lean(),
      User.findOne({ uid: reporterId }).lean(),
    ])
      .then(([sellerUser, reporterUser]) => {
        const sellerEmail = ad.ownerEmail || sellerUser?.email || "";
        const reporterEmail = reporterUser?.email || "";

        if (sellerEmail) {
          EmailService.sendTemplate({
            to: sellerEmail,
            template: "AD_REPORTED",
            data: {
              name: ad.ownerName || sellerUser?.name || "there",
              adTitle: derivedAdTitle,
            },
          }).catch((err) => {
            console.error("Ad reported email failed:", err?.message || err);
          });
        }

        if (reporterEmail) {
          EmailService.sendTemplate({
            to: reporterEmail,
            template: "REPORT_RECEIVED",
            data: {
              name: reporterUser?.name || reporterName || "there",
              adTitle: derivedAdTitle,
            },
          }).catch((err) => {
            console.error("Report received email failed:", err?.message || err);
          });
        }
      })
      .catch(() => {});

    logCtx("REPORT_CREATED", {
      reportId: report?._id,
      adId,
      reporterId,
      sellerId: derivedSellerId,
    });

    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    logCtx("REPORT_CREATE_FAILED", {
      reporterId,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to submit report", null, "SERVER_ERROR");
  }
};

/* ---------------------------
   GET USER REPORTS (Hardened)
   - Validate userId matches auth
   - Optional pagination (kept simple)
---------------------------- */
export const getUserReports = async (req, res) => {
  const reporterId = getReporterIdFromAuth(req);

  try {
    const { userId } = req.params;

    if (!reporterId) {
      return sendError(res, 401, "Unauthorized", null, "UNAUTHORIZED");
    }

    if (!userId || reporterId !== userId) {
      return sendError(res, 403, "Access denied", { reporterId, userId }, "FORBIDDEN");
    }

    // Optional pagination
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find({ reporterId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments({ reporterId: userId }),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (err) {
    logCtx("GET_USER_REPORTS_FAILED", {
      reporterId,
      userId: req.params?.userId,
      err: err?.message,
      stack: err?.stack,
    });

    return sendError(res, 500, "Failed to fetch user reports", null, "SERVER_ERROR");
  }
};
