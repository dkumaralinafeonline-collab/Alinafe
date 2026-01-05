import ContactMessage from "../models/ContactMessage.js";

/* ===============================
   CREATE CONTACT MESSAGE
================================ */
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 🔒 Strict validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are mandatory",
      });
    }

    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Message submitted successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
    });
  }
};

/* ===============================
   ADMIN: GET ALL MESSAGES
================================ */
export const getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Fetch contact messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

/* ===============================
   ADMIN: MARK AS READ
================================ */
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update message",
    });
  }
};
