import User from "../models/User.js";

// ✅ Register or Sync User from Firebase
export const registerUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL } = req.body;

    if (!uid || !email)
      return res.status(400).json({ message: "Missing required fields" });

    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({ uid, name, email, photoURL });
      console.log("🆕 New user added:", user.email);
    } else {
      user.lastLogin = new Date();
      await user.save();
      console.log("👤 Existing user logged in:", user.email);
    }

    res.status(200).json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
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
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Profile Data
export const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phone, location, photoURL } = req.body;

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.photoURL = photoURL || user.photoURL;
    user.lastLogin = new Date();

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
