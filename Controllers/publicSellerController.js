import Ad from "../models/Ad.js";

/* =====================================================
   🌍 GET SELLER ADS (PUBLIC)
   GET /api/public/sellers/:sellerId/ads
   - Anyone can view
   - No auth required
===================================================== */
export const getPublicSellerAds = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const ads = await Ad.find({
      ownerUid: sellerId,
      status: "Approved", // ✅ ONLY approved ads
    }).sort({ createdAt: -1 });

    return res.status(200).json(ads);
  } catch (error) {
    console.error("❌ Public seller ads error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
