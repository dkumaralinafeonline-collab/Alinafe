// src/utils/emailTemplates/welcome.template.js
import { baseTemplate, htmlBlock } from "./base.template.js";

const escapeHtml = (str = "") =>
  String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const welcomeTemplate = ({ name = "there" } = {}) => {
  const safeName = escapeHtml(name);

  const content = htmlBlock(`
    <div style="font-size:14px;line-height:22px;color:#111827;">
      <p style="margin:0 0 12px;">Hi <b>${safeName}</b>,</p>
      <p style="margin:0 0 12px;">
        Welcome! Your account is ready. Start exploring listings, posting ads, and connecting with buyers & sellers.
      </p>
      <p style="margin:0 0 12px;">
        If you didn’t sign up, please ignore this email.
      </p>
      <p style="margin:18px 0 0;">— Team</p>
    </div>
  `);

  return baseTemplate({
    title: "Welcome 🎉",
    preheader: "Your account is ready.",
    contentHtml: content,
  });
};
