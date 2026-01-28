// src/utils/emailTemplates/reportReceived.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const reportReceivedTemplate = ({
  name = "there",
  adTitle = "the ad",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(adTitle);

  return baseTemplate({
    title: "Report received",
    preheader: "We received your report.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          Your report for <b>${safeTitle}</b> has been submitted. Our team will review it soon.
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
