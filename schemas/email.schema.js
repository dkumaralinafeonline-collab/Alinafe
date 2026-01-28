// src/schemas/email.schema.js
import { z } from "zod";

const emailString = z
  .string()
  .trim()
  .email("Valid email required");

export const sendEmailSchema = z.object({
  to: emailString,
  subject: z.string().trim().min(1, "Subject required").max(120, "Subject too long"),
  text: z.string().trim().min(1, "Text required").max(5000, "Text too long").optional(),
  html: z.string().trim().min(1, "HTML required").max(150000, "HTML too long").optional(),

  // Safety: allow only one of text/html or both (both allowed)
}).refine((data) => data.text || data.html, {
  message: "Provide at least one: text or html",
});

export const sendTemplateEmailSchema = z.object({
  to: emailString,
  template: z.enum([
    "WELCOME",
    "OTP",
    "RESET_PASSWORD",
    "AD_POSTED",
    "AD_APPROVED",
    "AD_REJECTED",
    "LOGIN_SUCCESS",
    "LOGOUT_SUCCESS",
    "CHAT_STARTED",
    "CALLBACK_REQUESTED",
    "AD_REPORTED",
    "REPORT_RECEIVED",
    "REPORT_APPROVED",
    "REPORT_REJECTED",
    "AD_DELETED_BY_ADMIN",
  ]),
  data: z
    .object({
      name: z.string().trim().max(60).optional(),
      otp: z.string().trim().max(12).optional(),
      minutes: z.number().int().min(1).max(60).optional(),
      resetLink: z.string().trim().url().max(2000).optional(),
      title: z.string().trim().max(120).optional(),
      reason: z.string().trim().max(200).optional(),
      senderName: z.string().trim().max(80).optional(),
      message: z.string().trim().max(2000).optional(),
      phone: z.string().trim().max(40).optional(),
      adTitle: z.string().trim().max(120).optional(),
      adminNote: z.string().trim().max(500).optional(),
    })
    .default({}),
});
