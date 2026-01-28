// src/utils/emailTemplates/reportApproved.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const reportApprovedTemplate = ({
  name = "there",
  adTitle = "the ad",
  adminNote = "",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(adTitle);
  const safeNote = escapeHtml(adminNote);

  return baseTemplate({
    title: "Report approved",
    preheader: "Your report was approved.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          Your report for <b>${safeTitle}</b> has been approved.
        </p>
        ${safeNote ? `<p style="margin:0 0 12px;"><b>Admin note:</b> ${safeNote}</p>` : ""}
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
