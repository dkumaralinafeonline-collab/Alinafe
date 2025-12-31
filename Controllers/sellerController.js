import Ad from "../models/Ad.js";

/* =====================================================
   🏪 GET SELLER ADS
   🔐 LOGIN REQUIRED
   🔒 SELLER HIMSELF OR ADMIN ONLY
   GET /api/sellers/:sellerId/ads
===================================================== */
export const getSellerAds = async (req, res) => {
  try {
    const { sellerId } = req.params;

    /* ===============================
       🧪 BASIC VALIDATION
    =============================== */
    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    /* ===============================
       🔐 AUTH + ACCESS CHECK
    =============================== */
    if (
      !req.user ||
      (req.user.uid !== sellerId && req.user.role !== "admin")
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    /* ===============================
       📦 FETCH ADS
    =============================== */
    const ads = await Ad.find({ ownerUid: sellerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json(ads);
  } catch (error) {
    console.error("❌ Get seller ads error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
