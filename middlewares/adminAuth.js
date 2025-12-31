import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token (🔥 SAME SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Check role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 4️⃣ Fetch admin (optional but SAFE)
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // 5️⃣ Attach admin
    req.admin = admin;

    next();
  } catch (err) {
    console.error("AdminAuth error:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default adminAuth;
