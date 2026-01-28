// src/services/sms.service.js
import { infobipClient } from "../config/infobip.js";
import { env } from "../config/env.js";

const normalizeError = (err) => {
  const status = err?.response?.status || 500;
  const data = err?.response?.data;

  return {
    status,
    message: data?.requestError?.serviceException?.text || err?.message || "SMS send failed",
    provider: "infobip",
    details: data || null,
  };
};

export const SmsService = {
  async sendOtp({ to, otp, minutes = 5 }) {
    const payload = {
      messages: [
        {
          from: env.INFOBIP_SMS_SENDER,
          destinations: [{ to }],
          text: `Your ${env.APP_NAME} OTP is ${otp}. Valid for ${minutes} minutes.`,
        },
      ],
    };

    try {
      const res = await infobipClient.post("/sms/2/text/advanced", payload);
      return { provider: "infobip", response: res.data };
    } catch (err) {
      console.error(
        "Infobip SMS send error:",
        err?.response?.status,
        err?.response?.data || err?.message
      );
      throw normalizeError(err);
    }
  },
};
