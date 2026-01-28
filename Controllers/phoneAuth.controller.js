// src/controllers/phoneAuth.controller.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import PhoneOtp from "../models/PhoneOtp.js";
import User from "../models/User.js";
import { SmsService } from "../Services/sms.service.js";

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

const normalizePhone = (raw = "") => {
  const trimmed = String(raw).trim().replace(/\s+/g, "");

  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  // If 10 digits, assume India and add +91
  if (/^\d{10}$/.test(trimmed)) {
    return `+91${trimmed}`;
  }

  return trimmed;
};

const isValidPhone = (phone) => /^\+\d{8,15}$/.test(phone);

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

export const PhoneAuthController = {
  async sendOtp(req, res) {
    try {
      const { phone } = req.validated?.body || {};
      const normalizedPhone = normalizePhone(phone);

      if (!isValidPhone(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number. Use country code like +91XXXXXXXXXX.",
        });
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await PhoneOtp.deleteMany({ phone: normalizedPhone });
      await PhoneOtp.create({
        phone: normalizedPhone,
        codeHash: hashOtp(otp),
        expiresAt,
      });

      await SmsService.sendOtp({
        to: normalizedPhone,
        otp,
        minutes: OTP_TTL_MINUTES,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent",
        phone: normalizedPhone,
        expiresInMinutes: OTP_TTL_MINUTES,
      });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({
        success: false,
        message: err?.message || "Failed to send OTP",
        provider: err?.provider || "unknown",
        details: err?.details || null,
      });
    }
  },

  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.validated?.body || {};
      const normalizedPhone = normalizePhone(phone);

      if (!isValidPhone(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number. Use country code like +91XXXXXXXXXX.",
        });
      }

      const record = await PhoneOtp.findOne({ phone: normalizedPhone });
      if (!record) {
        return res.status(400).json({
          success: false,
          message: "OTP not found or expired",
        });
      }

      if (record.expiresAt < new Date()) {
        await PhoneOtp.deleteOne({ _id: record._id });
        return res.status(400).json({
          success: false,
          message: "OTP expired",
        });
      }

      const matches = record.codeHash === hashOtp(otp);
      if (!matches) {
        record.attempts += 1;
        await record.save();

        if (record.attempts >= MAX_ATTEMPTS) {
          await PhoneOtp.deleteOne({ _id: record._id });
        }

        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      await PhoneOtp.deleteOne({ _id: record._id });

      const user = await User.findOne({ phone: normalizedPhone });
      if (!user) {
        return res.status(200).json({
          success: true,
          phone: normalizedPhone,
          requiresSignup: true,
        });
      }

      const token = jwt.sign(
        { uid: user.uid, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        phone: normalizedPhone,
        token,
        user,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err?.message || "OTP verification failed",
      });
    }
  },
};
