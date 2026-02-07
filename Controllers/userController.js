import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import streamifier from "streamifier";
import bcrypt from "bcrypt";
import { EmailService } from "../Services/email.service.js";

const LOGIN_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_OTP_WINDOW_LIMIT = 3;
const PASSWORD_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_OTP_MAX_ATTEMPTS = 5;
const PASSWORD_OTP_WINDOW_MS = 10 * 60 * 1000;
const PASSWORD_OTP_WINDOW_LIMIT = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getProviderFromFirebase = (firebaseUser = {}) => {
  const provider = firebaseUser.firebase?.sign_in_provider;
  if (provider === "password") return "password";
  if (provider === "google.com") return "google";
  return "google";
};

const canSendLoginEmail = (lastLoginNotifiedAt) => {
  if (!lastLoginNotifiedAt) return true;
  return Date.now() - new Date(lastLoginNotifiedAt).getTime() >= LOGIN_EMAIL_COOLDOWN_MS;
};

const isStrongPassword = (password = "") => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
const normalizePhone = (value = "") => String(value).replace(/\D/g, "");
const buildPhoneCandidates = (value = "") => {
  const digits = normalizePhone(value);
  if (!digits) return [];
  const set = new Set([digits]);
  if (digits.startsWith("0") && digits.length > 1) {
    set.add(digits.slice(1));
  }
  if (!digits.startsWith("0")) {
    set.add(`0${digits}`);
  }
  if (digits.startsWith("91") && digits.length > 10) {
    const withoutCountry = digits.slice(2);
    set.add(withoutCountry);
    set.add(`0${withoutCountry}`);
  }
  return Array.from(set);
};

const uploadPhotoToCloudinary = async (photoURL) => {
  if (!photoURL || !photoURL.startsWith("http")) return "";

  const response = await axios.get(photoURL, { responseType: "arraybuffer" });
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "alinafe/users" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(response.data).pipe(uploadStream);
  });

  return uploadResult.secure_url;
};

/* =====================================================
   REGISTER / SYNC USER (FIREBASE TOKEN PROTECTED)
===================================================== */
export const registerUser = async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser?.uid || !firebaseUser?.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase identity",
      });
    }

    const uid = firebaseUser.uid;
    const email = firebaseUser.email;
    const nameFromBody = req.body?.name;
    const photoURLFromBody = req.body?.photoURL;
    const contactNumberFromBody = normalizePhone(req.body?.contactNumber || req.body?.phone || "");
    const categoryFromBody = String(req.body?.category || "").trim();
    const fallbackName =
      nameFromBody || firebaseUser.name || email.split("@")[0] || "User";

    let user = await User.findOne({ uid });
    let created = false;
    let cloudinaryUrl = "";

    try {
      if (
        photoURLFromBody &&
        (!user || !user.photoURL?.includes("res.cloudinary.com"))
      ) {
        cloudinaryUrl = await uploadPhotoToCloudinary(photoURLFromBody);
      }
    } catch (imgErr) {
      console.error("Image upload skipped:", imgErr.message);
    }

    const desiredPhoto =
      cloudinaryUrl ||
      photoURLFromBody ||
      firebaseUser.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}`;

    if (!user) {
      try {
        user = await User.create({
          uid,
          name: fallbackName,
          email,
          photoURL: desiredPhoto,
          phone: contactNumberFromBody || "",
          contactNumber: contactNumberFromBody || "",
          category: categoryFromBody || "",
          authProvider: getProviderFromFirebase(firebaseUser),
          emailVerified: !!firebaseUser.email_verified,
          verified: !!firebaseUser.email_verified,
          lastLogin: new Date(),
        });
        created = true;

        EmailService.sendTemplate({
          to: email,
          template: "WELCOME",
          data: { name: fallbackName },
        }).catch((err) => {
          console.error("Welcome email failed:", err?.message || err);
        });
      } catch (err) {
        if (err?.code === 11000) {
          user = await User.findOne({ uid });
        } else {
          throw err;
        }
      }
    } else {
      user.lastLogin = new Date();
      user.name = fallbackName || user.name;
      user.email = email;
      if (cloudinaryUrl) user.photoURL = cloudinaryUrl;
      if (contactNumberFromBody) {
        user.phone = contactNumberFromBody;
        user.contactNumber = contactNumberFromBody;
      }
      if (!user.contactNumber && user.phone) {
        user.contactNumber = normalizePhone(user.phone);
      }
      if (categoryFromBody) {
        user.category = categoryFromBody;
      }

      // Keep verification state synced with Firebase if already verified there.
      if (firebaseUser.email_verified) {
        user.emailVerified = true;
        user.verified = true;
      }

      const provider = getProviderFromFirebase(firebaseUser);
      if (!user.passwordHash) {
        user.authProvider = provider;
      }

      if (canSendLoginEmail(user.lastLoginNotifiedAt)) {
        EmailService.sendTemplate({
          to: email,
          template: "LOGIN_SUCCESS",
          data: { name: user.name || fallbackName },
        }).catch((err) => {
          console.error("Login email failed:", err?.message || err);
        });
        user.lastLoginNotifiedAt = new Date();
      }

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: created ? "User registered successfully" : "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   RESOLVE LOGIN IDENTIFIER (EMAIL OR PHONE)
===================================================== */
export const resolveLoginIdentifier = async (req, res) => {
  try {
    const identifierRaw = String(req.body?.identifier || "").trim();
    if (!identifierRaw) {
      return res.status(400).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const isEmail = EMAIL_REGEX.test(identifierRaw);
    const normalizedEmail = identifierRaw.toLowerCase();
    const phoneCandidates = buildPhoneCandidates(identifierRaw);

    let user = null;
    if (isEmail) {
      user = await User.findOne({ email: normalizedEmail }).select(
        "email authProvider passwordHash status"
      );
    } else if (phoneCandidates.some((p) => p.length >= 10)) {
      const candidates = await User.find({
        $or: [
          { contactNumber: { $in: phoneCandidates } },
          { phone: { $in: phoneCandidates } },
        ],
      })
        .select("email authProvider passwordHash status updatedAt")
        .sort({ updatedAt: -1 })
        .limit(25);

      // Prefer accounts that can use password login when multiple users share a phone value.
      user =
        candidates.find(
          (u) =>
            u.status !== "Suspended" &&
            (u.authProvider === "password" ||
              u.authProvider === "google+password" ||
              !!u.passwordHash)
        ) ||
        candidates.find((u) => u.status !== "Suspended") ||
        null;
    }

    if (!user || user.status === "Suspended") {
      return res.status(400).json({
        success: false,
        message: "Invalid email/phone or password",
      });
    }

    const isGoogleOnly = user.authProvider === "google" && !user.passwordHash;
    if (isGoogleOnly) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    return res.status(200).json({
      success: true,
      email: user.email,
    });
  } catch (error) {
    console.error("Error resolving login identifier:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process login",
    });
  }
};

/* =====================================================
   GET USER PROFILE (FIREBASE TOKEN PROTECTED)
===================================================== */
export const getUserProfile = async (req, res) => {
  try {
    const uid = req.firebaseUser?.uid;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPDATE USER PROFILE (FIREBASE TOKEN PROTECTED)
===================================================== */
export const updateUserProfile = async (req, res) => {
  try {
    const uid = req.firebaseUser?.uid;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, phone, location } = req.body;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    if (phone) {
      user.contactNumber = normalizePhone(phone);
    }
    user.location = location || user.location;
    user.lastLogin = new Date();

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPDATE USER PHOTO (FIREBASE TOKEN PROTECTED + MULTER)
===================================================== */
export const updateUserPhoto = async (req, res) => {
  try {
    const uid = req.firebaseUser?.uid;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid image",
      });
    }

    user.photoURL = req.file.path;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      photoURL: user.photoURL,
      user,
    });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   LOGOUT USER (FIREBASE TOKEN PROTECTED)
===================================================== */
export const logoutUser = async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser?.uid || !firebaseUser?.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase identity",
      });
    }

    const email = firebaseUser.email;
    const name = req.body?.name || firebaseUser.name || email.split("@")[0];

    EmailService.sendTemplate({
      to: email,
      template: "LOGOUT_SUCCESS",
      data: { name },
    }).catch((err) => {
      console.error("Logout email failed:", err?.message || err);
    });

    return res.status(200).json({
      success: true,
      message: "Logout email queued",
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   EMAIL OTP: SEND (FIREBASE TOKEN PROTECTED)
===================================================== */
export const sendEmailOtp = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser || {};
    if (!uid || !email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const windowStart = user.emailOtpWindowStart
      ? new Date(user.emailOtpWindowStart)
      : null;

    if (!windowStart || now.getTime() - windowStart.getTime() > EMAIL_OTP_WINDOW_MS) {
      user.emailOtpWindowStart = now;
      user.emailOtpSendCount = 0;
    }

    if ((user.emailOtpSendCount || 0) >= EMAIL_OTP_WINDOW_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Try again later.",
      });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const otpHash = await bcrypt.hash(otp, 10);

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = new Date(now.getTime() + EMAIL_OTP_TTL_MS);
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = now;
    user.emailOtpSendCount = (user.emailOtpSendCount || 0) + 1;
    await user.save();

    await EmailService.sendTemplate({
      to: email,
      template: "OTP",
      data: { otp, minutes: 10 },
    });

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email",
    });
  } catch (error) {
    console.error("Error sending email OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not send OTP",
    });
  }
};

/* =====================================================
   EMAIL OTP: VERIFY (FIREBASE TOKEN PROTECTED)
===================================================== */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { uid } = req.firebaseUser || {};
    const otp = String(req.body?.otp || "").trim();

    if (!uid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = await User.findOne({ uid });
    if (!user || !user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if (new Date(user.emailOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if ((user.emailOtpAttempts || 0) >= EMAIL_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Request a new code.",
      });
    }

    const matched = await bcrypt.compare(otp, user.emailOtpHash);
    if (!matched) {
      user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.emailVerified = true;
    user.verified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify OTP",
    });
  }
};

/* =====================================================
   PASSWORD: CREATE / SET (FIREBASE TOKEN PROTECTED)
===================================================== */
export const setUserPassword = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser || {};
    const newPassword = String(req.body?.newPassword || "");

    if (!uid || !email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8+ chars with 1 uppercase and 1 number",
      });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);

    if (user.authProvider === "google") {
      user.authProvider = "google+password";
    } else if (!user.authProvider) {
      user.authProvider = "password";
    }

    await user.save();

    EmailService.sendRaw({
      to: email,
      subject: "Password updated on ALINAFE",
      text: "Your password was successfully updated.",
      html: "<p>Your password was successfully updated.</p>",
    }).catch((err) => {
      console.error("Password update email failed:", err?.message || err);
    });

    return res.status(200).json({
      success: true,
      message: "Password saved successfully",
    });
  } catch (error) {
    console.error("Error setting password:", error);
    return res.status(500).json({
      success: false,
      message: "Could not set password",
    });
  }
};

/* =====================================================
   PASSWORD: UPDATE WITH OLD PASSWORD (FIREBASE TOKEN PROTECTED)
===================================================== */
export const updateUserPassword = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser || {};
    const oldPassword = String(req.body?.oldPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!uid || !email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8+ chars with 1 uppercase and 1 number",
      });
    }

    const user = await User.findOne({ uid });
    if (!user || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: "Password not set for this account",
      });
    }

    const matched = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!matched) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    if (user.authProvider === "google") user.authProvider = "google+password";
    await user.save();

    EmailService.sendRaw({
      to: email,
      subject: "Password updated on ALINAFE",
      text: "Your password was successfully updated.",
      html: "<p>Your password was successfully updated.</p>",
    }).catch((err) => {
      console.error("Password update email failed:", err?.message || err);
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update password",
    });
  }
};

/* =====================================================
   PASSWORD RESET OTP: SEND (FIREBASE TOKEN PROTECTED)
===================================================== */
export const sendPasswordResetOtp = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser || {};
    if (!uid || !email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const windowStart = user.passwordResetOtpWindowStart
      ? new Date(user.passwordResetOtpWindowStart)
      : null;

    if (!windowStart || now.getTime() - windowStart.getTime() > PASSWORD_OTP_WINDOW_MS) {
      user.passwordResetOtpWindowStart = now;
      user.passwordResetOtpSendCount = 0;
    }

    if ((user.passwordResetOtpSendCount || 0) >= PASSWORD_OTP_WINDOW_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Try again later.",
      });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    user.passwordResetOtpExpiresAt = new Date(now.getTime() + PASSWORD_OTP_TTL_MS);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpSendCount = (user.passwordResetOtpSendCount || 0) + 1;
    user.passwordResetVerifiedAt = null;
    await user.save();

    await EmailService.sendTemplate({
      to: email,
      template: "OTP",
      data: { otp, minutes: 10 },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Error sending password reset OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not send password reset OTP",
    });
  }
};

/* =====================================================
   PASSWORD RESET OTP: VERIFY (FIREBASE TOKEN PROTECTED)
===================================================== */
export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { uid } = req.firebaseUser || {};
    const otp = String(req.body?.otp || "").trim();

    if (!uid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = await User.findOne({ uid });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if ((user.passwordResetOtpAttempts || 0) >= PASSWORD_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Request a new code.",
      });
    }

    const matched = await bcrypt.compare(otp, user.passwordResetOtpHash);
    if (!matched) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.passwordResetVerifiedAt = new Date();
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified. You can now set a new password.",
    });
  } catch (error) {
    console.error("Error verifying password reset OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify password reset OTP",
    });
  }
};

/* =====================================================
   PASSWORD RESET: SAVE NEW PASSWORD (FIREBASE TOKEN PROTECTED)
===================================================== */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser || {};
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!uid || !email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8+ chars with 1 uppercase and 1 number",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match",
      });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.passwordResetVerifiedAt) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    // OTP verification window for password reset is 10 minutes.
    if (Date.now() - new Date(user.passwordResetVerifiedAt).getTime() > PASSWORD_OTP_TTL_MS) {
      user.passwordResetVerifiedAt = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP verification expired. Please verify again",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    if (user.authProvider === "google") user.authProvider = "google+password";
    else if (!user.authProvider) user.authProvider = "password";

    // Clear password-reset OTP state after successful reset.
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerifiedAt = null;
    await user.save();

    EmailService.sendRaw({
      to: email,
      subject: "Password updated on ALINAFE",
      text: "Your password was successfully updated.",
      html: "<p>Your password was successfully updated.</p>",
    }).catch((err) => {
      console.error("Password reset email failed:", err?.message || err);
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password with OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Could not reset password",
    });
  }
};
