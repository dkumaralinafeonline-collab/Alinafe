// src/utils/emailTemplates/resetPassword.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const resetPasswordTemplate = ({ resetLink = "" } = {}) => {
  const safeLink = escapeHtml(resetLink);

  const content = htmlBlock(`
    <div style="font-size:14px;line-height:22px;color:#111827;">
      <p style="margin:0 0 12px;">
        We received a request to reset your password.
      </p>

      <p style="margin:0 0 14px;">
        Click the button below:
      </p>

      <a href="${safeLink}" style="display:inline-block;padding:12px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">
        Reset Password
      </a>

      <p style="margin:14px 0 0;color:#6b7280;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  `);

  return baseTemplate({
    title: "Reset your password",
    preheader: "Reset link inside.",
    contentHtml: content,
  });
};
