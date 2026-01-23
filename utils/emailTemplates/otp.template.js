// src/utils/emailTemplates/otp.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

export const otpTemplate = ({
  name = "there",
  otp = "",
  expiresInMinutes = 10,
} = {}) => {
  return baseTemplate({
    title: "Verify your email",
    preheader: `Your verification code is ${otp}`,
    contentHtml: htmlBlock(`
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#111827;">
        Hi ${name},
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
        Use the following OTP to complete your verification.
      </p>
      <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0b1220;color:#ffffff;font-size:20px;letter-spacing:4px;font-weight:700;">
        ${otp}
      </div>
      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">
        This code expires in ${expiresInMinutes} minutes.
      </p>
    `),
  });
};
