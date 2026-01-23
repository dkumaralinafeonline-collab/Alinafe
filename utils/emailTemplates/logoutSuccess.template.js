// src/utils/emailTemplates/logoutSuccess.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const logoutSuccessTemplate = ({ name = "there" } = {}) => {
  const safeName = escapeHtml(name);

  return baseTemplate({
    title: "Logged out successfully",
    preheader: "You’re logged out of Alinafe.",
    contentHtml: htmlBlock(`
      <div style="font-size:14px;line-height:22px;color:#111827;">
        <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
        <p style="margin:0 0 12px;">
          You have successfully logged out of your Alinafe account.
        </p>
        <p style="margin:18px 0 0;">Team Alinafe</p>
      </div>
    `),
  });
};
