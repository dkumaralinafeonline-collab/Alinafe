// src/middlewares/rateLimit.js
import rateLimit from "express-rate-limit";

// 🔍 Search API limiter (strict)
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again.",
  },
});

// 🔥 Trending API limiter (lighter)
export const trendingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a moment.",
  },
});

// 📩 Email API limiter (secure)
export const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 email requests/min/IP (adjust as needed)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many email requests. Please try again shortly.",
  },
});
