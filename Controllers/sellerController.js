import Ad from "../models/Ad.js";

export const getSellerAds = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const ads = await Ad.find({ ownerUid: sellerId })
      .sort({ createdAt: -1 });

    res.status(200).json(ads);
  } catch (error) {
    console.error("Get seller ads error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
