// src/controllers/email.controller.js
import { EmailService } from "../Services/email.service.js";

export const EmailController = {
  async sendEmail(req, res) {
    try {
      const body = req.validated?.body;
      const result = await EmailService.sendRaw(body);

      return res.status(200).json({
        success: true,
        message: "Email sent",
        ...result,
      });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({
        success: false,
        message: err?.message || "Email send failed",
        provider: err?.provider || "unknown",
        details: err?.details || null,
      });
    }
  },

  async sendTemplate(req, res) {
    try {
      const body = req.validated?.body;
      const result = await EmailService.sendTemplate(body);

      return res.status(200).json({
        success: true,
        message: "Template email sent",
        ...result,
      });
    } catch (err) {
      const status = err?.status || 500;
      return res.status(status).json({
        success: false,
        message: err?.message || "Template send failed",
        provider: err?.provider || "unknown",
        details: err?.details || null,
      });
    }
  },
};
