// src/services/email.service.js
import { infobipClient } from "../config/infobip.js";
import { env } from "../config/env.js";
import FormData from "form-data";

import { welcomeTemplate } from "../utils/emailTemplates/welcome.template.js";
import { otpTemplate } from "../utils/emailTemplates/otp.template.js";
import { resetPasswordTemplate } from "../utils/emailTemplates/resetPassword.template.js";
import { adPostedTemplate } from "../utils/emailTemplates/adPosted.template.js";
import { adApprovedTemplate } from "../utils/emailTemplates/adApproved.template.js";
import { adRejectedTemplate } from "../utils/emailTemplates/adRejected.template.js";
import { loginSuccessTemplate } from "../utils/emailTemplates/loginSuccess.template.js";
import { logoutSuccessTemplate } from "../utils/emailTemplates/logoutSuccess.template.js";
import { chatStartedTemplate } from "../utils/emailTemplates/chatStarted.template.js";
import { callbackRequestedTemplate } from "../utils/emailTemplates/callbackRequested.template.js";
import { adReportedTemplate } from "../utils/emailTemplates/adReported.template.js";
import { reportReceivedTemplate } from "../utils/emailTemplates/reportReceived.template.js";
import { reportApprovedTemplate } from "../utils/emailTemplates/reportApproved.template.js";
import { reportRejectedTemplate } from "../utils/emailTemplates/reportRejected.template.js";
import { adDeletedByAdminTemplate } from "../utils/emailTemplates/adDeletedByAdmin.template.js";

/**
 * Infobip Email Send:
 * POST /email/3/send
 * Payload: { from, to, subject, text, html, replyTo }
 */

const buildTemplate = (template, data = {}) => {
  switch (template) {
    case "WELCOME":
      return {
        subject: `Welcome to ${env.APP_NAME}`,
        html: welcomeTemplate({ name: data?.name }),
        text: `Welcome to ${env.APP_NAME}!`,
      };

    case "OTP":
      return {
        subject: `Your ${env.APP_NAME} verification code`,
        html: otpTemplate({ otp: data?.otp, minutes: data?.minutes ?? 10 }),
        text: `Your ${env.APP_NAME} code is ${data?.otp}. Expires in ${data?.minutes ?? 10} minutes.`,
      };

    case "RESET_PASSWORD":
      return {
        subject: `Reset your ${env.APP_NAME} password`,
        html: resetPasswordTemplate({ resetLink: data?.resetLink }),
        text: `Reset your password: ${data?.resetLink}`,
      };

    case "AD_POSTED":
      return {
        subject: `Your ${env.APP_NAME} ad is posted`,
        html: adPostedTemplate({ name: data?.name, title: data?.title }),
        text: `Your ad "${data?.title || "your ad"}" has been posted and is pending review.`,
      };

    case "AD_APPROVED":
      return {
        subject: `Your ${env.APP_NAME} ad is approved`,
        html: adApprovedTemplate({ name: data?.name, title: data?.title }),
        text: `Your ad "${data?.title || "your ad"}" has been approved and is now live.`,
      };

    case "AD_REJECTED":
      return {
        subject: `Your ${env.APP_NAME} ad was rejected`,
        html: adRejectedTemplate({
          name: data?.name,
          title: data?.title,
          reason: data?.reason,
        }),
        text: `Your ad "${data?.title || "your ad"}" was rejected. Reason: ${
          data?.reason || "No reason provided"
        }.`,
      };

    case "LOGIN_SUCCESS":
      return {
        subject: `Login successful on ${env.APP_NAME}`,
        html: loginSuccessTemplate({ name: data?.name }),
        text: `You have successfully logged in to ${env.APP_NAME}.`,
      };

    case "LOGOUT_SUCCESS":
      return {
        subject: `Logged out of ${env.APP_NAME}`,
        html: logoutSuccessTemplate({ name: data?.name }),
        text: `You have successfully logged out of ${env.APP_NAME}.`,
      };

    case "CHAT_STARTED":
      return {
        subject: `New chat on ${env.APP_NAME}`,
        html: chatStartedTemplate({
          name: data?.name,
          senderName: data?.senderName,
          title: data?.title,
        }),
        text: `${data?.senderName || "Someone"} started a chat on your listing "${data?.title || "your listing"}".`,
      };

    case "CALLBACK_REQUESTED":
      return {
        subject: `Callback request on ${env.APP_NAME}`,
        html: callbackRequestedTemplate({
          name: data?.name,
          senderName: data?.senderName,
          title: data?.title,
          phone: data?.phone,
          message: data?.message,
        }),
        text: `${data?.senderName || "Someone"} requested a call back for "${data?.title || "your listing"}".`,
      };

    case "AD_REPORTED":
      return {
        subject: `Your ${env.APP_NAME} ad was reported`,
        html: adReportedTemplate({
          name: data?.name,
          adTitle: data?.adTitle,
        }),
        text: `Your ad "${data?.adTitle || "your listing"}" was reported. Our team will review it.`,
      };

    case "REPORT_RECEIVED":
      return {
        subject: `We received your report on ${env.APP_NAME}`,
        html: reportReceivedTemplate({
          name: data?.name,
          adTitle: data?.adTitle,
        }),
        text: `Your report for "${data?.adTitle || "the ad"}" has been submitted. We'll review it shortly.`,
      };

    case "REPORT_APPROVED":
      return {
        subject: `Your report was approved`,
        html: reportApprovedTemplate({
          name: data?.name,
          adTitle: data?.adTitle,
          adminNote: data?.adminNote,
        }),
        text: `Your report for "${data?.adTitle || "the ad"}" was approved.`,
      };

    case "REPORT_REJECTED":
      return {
        subject: `Your report was rejected`,
        html: reportRejectedTemplate({
          name: data?.name,
          adTitle: data?.adTitle,
          adminNote: data?.adminNote,
        }),
        text: `Your report for "${data?.adTitle || "the ad"}" was rejected.`,
      };

    case "AD_DELETED_BY_ADMIN":
      return {
        subject: `Your ${env.APP_NAME} ad was removed`,
        html: adDeletedByAdminTemplate({
          name: data?.name,
          adTitle: data?.adTitle,
          adminNote: data?.adminNote,
        }),
        text: `Your ad "${data?.adTitle || "your ad"}" was removed by admin.`,
      };

    default:
      throw new Error("Unknown template");
  }
};

const normalizeError = (err) => {
  // Axios errors
  const status = err?.response?.status || 500;
  const data = err?.response?.data;

  return {
    status,
    message: data?.message || err?.message || "Email send failed",
    provider: "infobip",
    details: data || null,
  };
};

export const EmailService = {
  async sendRaw({ to, subject, text, html }) {
    const formData = new FormData();
    formData.append("from", env.INFOBIP_EMAIL_SENDER);
    formData.append("to", to);
    formData.append("subject", subject);
    if (text) formData.append("text", text);
    if (html) formData.append("html", html);
    if (env.INFOBIP_EMAIL_REPLY) {
      formData.append("replyTo", env.INFOBIP_EMAIL_REPLY);
    }

    try {
      const res = await infobipClient.post("/email/3/send", formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return {
        provider: "infobip",
        response: res.data,
      };
    } catch (err) {
      console.error(
        "Infobip send error:",
        err?.response?.status,
        err?.response?.data || err?.message
      );
      throw normalizeError(err);
    }
  },

  async sendTemplate({ to, template, data }) {
    const built = buildTemplate(template, data);

    return this.sendRaw({
      to,
      subject: built.subject,
      text: built.text, 
      html: built.html,
    });
  },
};
