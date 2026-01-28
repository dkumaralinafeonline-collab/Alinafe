// src/config/env.js
import dotenv from "dotenv";

// Ensure .env is loaded before any required env access
dotenv.config();

/**
 * Centralized env access + safety checks
 * Keep secrets in .env only (never frontend)
 */

const required = (key) => {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env: ${key}`);
  }
  return String(v).trim();
};

const optional = (key, fallback = "") => {
  const v = process.env[key];
  if (!v || !String(v).trim()) return fallback;
  return String(v).trim();
};

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),

  INFOBIP_BASE_URL: required("INFOBIP_BASE_URL").replace(/\/+$/, ""),
  INFOBIP_API_KEY: required("INFOBIP_API_KEY"),

  INFOBIP_EMAIL_SENDER: required("INFOBIP_EMAIL_SENDER"),
  INFOBIP_EMAIL_REPLY: optional("INFOBIP_EMAIL_REPLY", ""),
  INFOBIP_SMS_SENDER: required("INFOBIP_SENDER_ID"),

  APP_NAME: optional("APP_NAME", "ALINAFE"),

  // If set, email routes require: header "x-internal-email-key"
  INTERNAL_EMAIL_KEY: optional("INTERNAL_EMAIL_KEY", ""),
};
