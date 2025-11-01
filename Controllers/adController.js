import Ad from "../models/Ad.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

/* ================================
   🧠 CLOUDINARY CONFIG
================================ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================================
   🟢 CREATE AD
================================ */
export const createAd = async (req, res) => {
  try {
    const {
      ownerUid,
      ownerName,
      ownerEmail,
      ownerPhone,
      title,
      description,
      category,
      subcategory,
      price,
      negotiable,
      condition,
      city,
      location,
      deliveryAvailable,
      bedrooms,
      bathrooms,
      area,
      mileage,
      year,
      brand,
      warranty,
      size,
      color,
      salary,
      quantity,
      ageGroup,
      fileType,
      accessType,
    } = req.body;

    if (!ownerUid || !title || !description || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Fetch owner details if missing
    let finalName = ownerName;
    let finalEmail = ownerEmail;
    let finalPhone = ownerPhone;

    if (!ownerName || !ownerEmail || !ownerPhone) {
      const user = await User.findOne({ uid: ownerUid });
      if (user) {
        finalName = finalName || user.name;
        finalEmail = finalEmail || user.email;
        finalPhone = finalPhone || user.phone;
      }
    }

    // ✅ Use Cloudinary URLs (auto from multer-storage-cloudinary)
    const imagePaths = req.files
      ? req.files.map((f) => f.path || f.secure_url)
      : [];

    const newAd = await Ad.create({
      ownerUid,
      ownerName: finalName || "Unknown Seller",
      ownerEmail: finalEmail || "",
      ownerPhone: finalPhone || "",
      title,
      description,
      category,
      subcategory,
      price,
      negotiable: negotiable === "true" || negotiable === true,
      condition,
      city,
      location,
      deliveryAvailable: deliveryAvailable === "true" || deliveryAvailable === true,
      images: imagePaths,
      bedrooms,
      bathrooms,
      area,
      mileage,
      year,
      brand,
      warranty,
      size,
      color,
      salary,
      quantity,
      ageGroup,
      fileType,
      accessType,
    });

    res.status(201).json({
      message: "Ad created successfully",
      ad: newAd,
    });
  } catch (error) {
    console.error("Error creating ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   👤 GET USER ADS
================================ */
export const getUserAds = async (req, res) => {
  try {
    const { uid } = req.params;
    const ads = await Ad.find({ ownerUid: uid }).sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching user ads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   🌍 GET ALL ADS
================================ */
export const getAllAds = async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.city) filters.city = req.query.city;
    if (req.query.status) filters.status = req.query.status;

    const ads = await Ad.find(filters).sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   ✏️ UPDATE AD
================================ */
export const updateAd = async (req, res) => {
  try {
    const updates = req.body;

    // ✅ Replace image paths with Cloudinary URLs if uploaded
    const imagePaths = req.files ? req.files.map((f) => f.path || f.secure_url) : [];
    if (imagePaths.length > 0) updates.images = imagePaths;

    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedAd) return res.status(404).json({ message: "Ad not found" });

    res.status(200).json({
      message: "Ad updated successfully",
      ad: updatedAd,
    });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   ❌ DELETE AD
================================ */
export const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    await ad.deleteOne();
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   💰 MARK AS SOLD
================================ */
export const markAsSold = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.status = "Sold";
    await ad.save();

    res.status(200).json({ message: "Ad marked as sold", ad });
  } catch (error) {
    console.error("Error marking ad as sold:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ========================================
   👁️ INCREMENT AD VIEW COUNT
======================================== */
export const incrementView = async (req, res) => {
  try {
    const { userId, guestId } = req.body;
    const uniqueViewer = userId || guestId;
    const { id } = req.params;

    // 🧠 Validate Ad ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Ad ID" });
    }

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // 🧩 Prevent owner's self-view increment
    if (userId && ad.ownerUid === userId) {
      return res.json({ message: "Owner viewed — no increment" });
    }

    // 🧠 Prevent duplicate increments
    if (uniqueViewer && ad.viewedBy.includes(uniqueViewer)) {
      return res.json({
        message: "Already viewed by this user",
        views: ad.views,
      });
    }

    // ✅ Increment once per unique viewer
    ad.views = (ad.views || 0) + 1;
    if (uniqueViewer) ad.viewedBy.push(uniqueViewer);

    await ad.save();

    res.json({ message: "View incremented", views: ad.views });
  } catch (error) {
    console.error("❌ Error updating view count:", error);
    res.status(500).json({
      message: "Server error while updating view count",
      error: error.message,
    });
  }
};
/* ================================
   ⚙️ CHANGE AD STATUS
================================ */
export const changeAdStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Active", "Hidden", "Expired", "Sold"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    ad.status = status;
    await ad.save();

    res.status(200).json({ message: `Ad status changed to ${status}`, ad });
  } catch (error) {
    console.error("Error changing ad status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   🟣 GET SINGLE AD BY ID (WITH SELLER)
================================ */
export const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    const seller = await User.findOne({ uid: ad.ownerUid }).select("name email phone");

    const adWithSeller = {
      ...ad.toObject(),
      seller: seller || null,
    };

    res.status(200).json(adWithSeller);
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   ❤️ FAVORITES COUNT
================================ */
export const updateFavoriteCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "add" or "remove"

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (action === "add") ad.favouritesCount = (ad.favouritesCount || 0) + 1;
    else if (action === "remove" && ad.favouritesCount > 0)
      ad.favouritesCount -= 1;

    await ad.save();
    res.status(200).json({ message: "Favorites updated", favouritesCount: ad.favouritesCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ================================
   🔎 SEARCH ADS
================================ */
export const searchAds = async (req, res) => {
  const { query, location } = req.query;
  try {
    const filters = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { subcategory: { $regex: query, $options: "i" } },
      ],
    };

    if (location && location !== "All Malawi") {
      filters.city = { $regex: location, $options: "i" };
    }

    const ads = await Ad.find(filters).sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
