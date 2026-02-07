import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Firebase token missing.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded;

    // Normalize trusted identity shape for downstream controllers/middlewares.
    const dbUser = await User.findOne({ uid: decoded.uid })
      .select("uid email role name")
      .lean();

    req.user = {
      uid: decoded.uid,
      email: decoded.email || dbUser?.email || "",
      role: dbUser?.role || "user",
      name: dbUser?.name || decoded.name || "",
      authType: "firebase",
    };

    next();
  } catch (error) {
    console.error(
      "Firebase token verify failed:",
      error?.code || error?.name || "UNKNOWN",
      error?.message || error
    );
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid Firebase token.",
    });
  }
};

export default verifyFirebaseToken;
