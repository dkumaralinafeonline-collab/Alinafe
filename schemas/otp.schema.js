// src/schemas/otp.schema.js
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Phone is required")
  .max(20, "Phone too long");

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});
