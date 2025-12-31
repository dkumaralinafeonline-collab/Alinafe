// Controllers/userController.js
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";

/* =====================================================
   🔹 REGISTER / SYNC USER (PUBLIC)
   Firebase login ke baad call hota hai
===================================================== */
export const registerUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL } = req.body;

    // ✅ BASIC VALIDATION
    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let user = await User.findOne({ uid });
    let cloudinaryUrl = "";

    // ✅ Upload photo to Cloudinary (only once)
    if (
      photoURL &&
      photoURL.startsWith("http") &&
      (!user || !user.photoURL?.includes("res.cloudinary.com"))
    ) {
      try {
        const response = await axios.get(photoURL, {
          responseType: "arraybuffer",
        });

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "alinafe/users" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          streamifier.createReadStream(response.data).pipe(uploadStream);
        });

        cloudinaryUrl = uploadResult.secure_url;
      } catch (imgErr) {
        console.error("⚠️ Image upload skipped:", imgErr.message);
      }
    }

    // ✅ CREATE OR UPDATE USER
    if (!user) {
      user = await User.create({
        uid,
        name: name || email.split("@")[0],
        email,
        photoURL:
        cloudinaryUrl ||
        photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name || email.split("@")[0]
        )}`,
              lastLogin: new Date(),
      });
      console.log("🆕 New user registered:", email);
    } else {
      user.lastLogin = new Date();
      if (cloudinaryUrl) user.photoURL = cloudinaryUrl;
      await user.save();
      console.log("👤 Existing user updated:", email);
    }

    // 🔐 ✅ CREATE JWT TOKEN (MOST IMPORTANT)
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      success: true,
      message: "User synced successfully",
      user,
      token, // 👈 frontend yahin se token lega
    });
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   👤 GET USER PROFILE (PRIVATE)
===================================================== */
export const getUserProfile = async (req, res) => {
  try {
    // 🔐 Security check
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   ✏️ UPDATE USER PROFILE (PRIVATE)
===================================================== */
export const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    // 🔐 Security check
    if (req.user.uid !== uid) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, phone, location } = req.body;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.lastLogin = new Date();

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
