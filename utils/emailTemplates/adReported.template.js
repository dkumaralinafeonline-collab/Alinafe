// src/utils/emailTemplates/adReported.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const adReportedTemplate = ({
  name = "there",
  adTitle = "your listing",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(adTitle);

  return baseTemplate({
    title: "Ad reported",
    preheader: "Your ad has been reported.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          Your ad <b>${safeTitle}</b> was reported by a user. Our team will review it shortly.
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
