// src/routes/phoneAuth.routes.js
import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { smsLimiter } from "../middlewares/rateLimit.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
} from "../schemas/otp.schema.js";
import { PhoneAuthController } from "../Controllers/phoneAuth.controller.js";

const router = Router();

router.post(
  "/send-otp",
  smsLimiter,
  validate(sendOtpSchema, "body"),
  PhoneAuthController.sendOtp
);

router.post(
  "/verify-otp",
  smsLimiter,
  validate(verifyOtpSchema, "body"),
  PhoneAuthController.verifyOtp
);

export default router;
