// src/utils/emailTemplates/adApproved.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const adApprovedTemplate = ({
  name = "there",
  title = "your ad",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(title);

  return baseTemplate({
    title: "Ad approved",
    preheader: "Your ad is now live.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          Great news! Your ad <b>${safeTitle}</b> has been approved and is now live.
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
