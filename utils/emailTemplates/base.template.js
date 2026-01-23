// src/utils/emailTemplates/base.template.js
import { env } from "../../config/env.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const baseTemplate = ({
  title = env.APP_NAME,
  preheader = "",
  contentHtml = "",
  footerNote = `© ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.`,
} = {}) => {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safePreheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:20px 22px;background:#0b1220;color:#ffffff;">
              <div style="font-size:14px;letter-spacing:2px;text-transform:uppercase;opacity:0.9;">${escapeHtml(
                env.APP_NAME
              )}</div>
              <div style="font-size:20px;font-weight:700;margin-top:6px;">${safeTitle}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px;">
              ${contentHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:16px 22px;background:#f9fafb;color:#6b7280;font-size:12px;">
              ${escapeHtml(footerNote)}
            </td>
          </tr>
        </table>

        <div style="max-width:640px;width:100%;margin-top:10px;color:#9ca3af;font-size:12px;">
          Need help? Reply to this email.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const htmlBlock = (inner) => inner; // tiny helper (readability)
