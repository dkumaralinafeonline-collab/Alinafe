// src/middlewares/validate.js
import { ZodError } from "zod";

/**
 * ✅ Node 20+ / 24 SAFE validation middleware
 * - Never mutates req.query / req.body directly
 * - Stores validated data in req.validated
 * - No crashes, production safe
 */

export const validate =
  (schema, property = "query") =>
  (req, res, next) => {
    try {
      const parsed = schema.parse(req[property]);

      // 🔐 SAFE STORAGE
      req.validated = req.validated || {};
      req.validated[property] = parsed;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          message: err.errors?.[0]?.message || "Invalid request",
          issues: err.errors?.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      console.error("❌ Validation Middleware Error:", err);
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid request data",
      });
    }
  };
