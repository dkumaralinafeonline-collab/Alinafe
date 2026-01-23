// src/utils/emailTemplates/chatStarted.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const chatStartedTemplate = ({
  name = "there",
  senderName = "Someone",
  title = "your listing",
} = {}) => {
  const safeName = escapeHtml(name);
  const safeSender = escapeHtml(senderName);
  const safeTitle = escapeHtml(title);

  return baseTemplate({
    title: "New chat request",
    preheader: "Someone started a chat on your listing.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          <b>${safeSender}</b> started a chat on your listing <b>${safeTitle}</b>.
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
