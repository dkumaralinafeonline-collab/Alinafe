// src/utils/emailTemplates/adRejected.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const adRejectedTemplate = ({
  name = "there",
  title = "your ad",
  reason = "No reason provided",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(title);
  const safeReason = escapeHtml(reason);

  return baseTemplate({
    title: "Ad rejected",
    preheader: "Your ad was not approved.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          Your ad <b>${safeTitle}</b> was rejected.
        </p>
        <p style="margin:0 0 12px;">
          Reason: <b>${safeReason}</b>
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
