import Ad from "../models/Ad.js";

export const getSellerStats = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const totalAds = await Ad.countDocuments({
      ownerUid: sellerId,
    });

    const approvedAds = await Ad.countDocuments({
      ownerUid: sellerId,
      status: "approved",
    });

    // seller first ad = joined date (fallback)
    const firstAd = await Ad.findOne({ ownerUid: sellerId })
      .sort({ createdAt: 1 })
      .select("createdAt");

    res.status(200).json({
      joinedAt: firstAd?.createdAt || null,
      totalAds,
      approvedAds,
      isTrustedSeller: approvedAds >= 3,
    });
  } catch (error) {
    console.error("Seller stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
