import Ad from "../models/Ad.js";

/* =====================================================
   📊 GET SELLER STATS (PUBLIC)
   🌍 NO LOGIN REQUIRED
   GET /api/sellers/:sellerId/stats
===================================================== */
export const getSellerStats = async (req, res) => {
  try {
    const { sellerId } = req.params;

    /* ===============================
       🧪 BASIC VALIDATION
    =============================== */
    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    /* ===============================
       📦 STATS CALCULATION
    =============================== */
    const totalAds = await Ad.countDocuments({
      ownerUid: sellerId,
    });

    const approvedAds = await Ad.countDocuments({
      ownerUid: sellerId,
      status: "Approved",
    });

    /* ===============================
       🕒 SELLER JOIN DATE
       (First Ad Created)
    =============================== */
    const firstAd = await Ad.findOne({ ownerUid: sellerId })
      .sort({ createdAt: 1 })
      .select("createdAt");

    /* ===============================
       ✅ RESPONSE (PUBLIC SAFE DATA)
    =============================== */
    return res.status(200).json({
      joinedAt: firstAd?.createdAt || null,
      totalAds,
      approvedAds,
      isTrustedSeller: approvedAds >= 3,
    });
  } catch (error) {
    console.error("❌ Seller stats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
