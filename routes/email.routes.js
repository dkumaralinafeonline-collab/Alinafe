// src/routes/email.routes.js
import express, { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { emailLimiter } from "../middlewares/rateLimit.js";
import { requireInternalEmailKey } from "../middlewares/internalAuth.js";

import { EmailController } from "../Controllers/email.controller.js";
import { sendEmailSchema, sendTemplateEmailSchema } from "../schemas/email.schema.js";

const router = Router();
router.use(express.text({ type: "*/*", limit: "2mb" }));
router.use((req, _res, next) => {
  if (typeof req.body === "string" && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // leave as-is, validation will fail with a clear message
    }
  }
  next();
});

/**
 * Secure email routes
 * - internal key guard (if enabled)
 * - rate limiter
 * - zod validation
 */

router.post(
  "/send",
  requireInternalEmailKey,
  emailLimiter,
  validate(sendEmailSchema, "body"),
  EmailController.sendEmail
);

router.post(
  "/send-template",
  requireInternalEmailKey,
  emailLimiter,
  validate(sendTemplateEmailSchema, "body"),
  EmailController.sendTemplate
);

export default router;
