// Controllers/userController.js
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";
import streamifier from "streamifier";

// 🔹 Register or Sync User (Firebase → Cloudinary → Mongo)
export const registerUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL } = req.body;
    if (!uid || !email)
      return res.status(400).json({ message: "Missing required fields" });

    let user = await User.findOne({ uid });
    let cloudinaryUrl = "";

    // ✅ Upload Firebase photo to Cloudinary only if not already uploaded
    if (
      photoURL &&
      photoURL.startsWith("http") &&
      (!user || !user.photoURL.includes("res.cloudinary.com"))
    ) {
      const response = await axios.get(photoURL, { responseType: "arraybuffer" });

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "zitheke/users" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(response.data).pipe(uploadStream);
      });

      cloudinaryUrl = uploadResult.secure_url;
    }

    // ✅ Create new or update existing user
    if (!user) {
      user = await User.create({
        uid,
        name,
        email,
        photoURL: cloudinaryUrl || photoURL || "",
      });
      console.log("🆕 New user registered:", user.email);
    } else {
      user.lastLogin = new Date();
      if (cloudinaryUrl) user.photoURL = cloudinaryUrl;
      await user.save();
      console.log("👤 Existing user updated:", user.email);
    }

    res.status(200).json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Fetch Profile by Firebase UID
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Profile (non-image fields)
export const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phone, location } = req.body;

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.lastLogin = new Date();

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
