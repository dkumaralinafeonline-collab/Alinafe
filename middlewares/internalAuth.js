// src/middlewares/internalAuth.js
import { env } from "../config/env.js";

/**
 * Simple internal guard for sensitive routes.
 * If INTERNAL_EMAIL_KEY is set, request must include:
 *   x-internal-email-key: <same secret>
 *
 * If not set, middleware allows traffic (useful in local dev).
 */
export const requireInternalEmailKey = (req, res, next) => {
  if (!env.INTERNAL_EMAIL_KEY) return next();

  const key = req.headers["x-internal-email-key"];
  if (!key || String(key) !== env.INTERNAL_EMAIL_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};
