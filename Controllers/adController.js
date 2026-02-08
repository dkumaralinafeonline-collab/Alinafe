import mongoose from "mongoose";
import Ad from "../models/Ad.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { EmailService } from "../Services/email.service.js";

/* ================================
   🧠 CLOUDINARY CONFIG
================================ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================================
   🟢 CREATE AD (Pending by default)
================================ */
export const createAd = async (req, res) => {
  try {
    // 1️⃣ Clone body (DO NOT destructure)
    const body = { ...req.body };
    const firebaseUser = req.firebaseUser || {};


    // 2️⃣ Required fields check
    if (!firebaseUser.uid || !body.title || !body.description || !body.category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 3️⃣ Remove empty values (SAFE CLEANUP)
    Object.keys(body).forEach((key) => {
      if (body[key] === "" || body[key] === null || body[key] === undefined) {
        delete body[key];
      }
    });
    // 4) Owner identity comes from verified token/DB only (ignore spoofed body identity)
    body.ownerUid = firebaseUser.uid;
    const ownerUser = await User.findOne({ uid: firebaseUser.uid }).select(
      "name email phone"
    );
    body.ownerEmail = ownerUser?.email || firebaseUser.email || "";
    body.ownerName =
      ownerUser?.name ||
      firebaseUser.name ||
      body.ownerEmail?.split("@")[0] ||
      "User";
    body.ownerPhone = ownerUser?.phone || "";

    // 5️⃣ Boolean normalization
    body.negotiable =
      body.negotiable === "true" || body.negotiable === true;

    body.deliveryAvailable =
      body.deliveryAvailable === "true" || body.deliveryAvailable === true;

    // 6️⃣ Images from Cloudinary / Multer
    const imagePaths = req.files?.images
      ? req.files.images.map((f) => f.path || f.secure_url)
      : [];

    /* ==================================================
       🔎 6.5️⃣ AUTO TAG GENERATION (ROOT SEARCH FIX)
       - category
       - subcategory
       - title keywords
       - existing tags (if any)
    ================================================== */
    const autoTags = new Set();

    // from title
    if (body.title) {
      body.title
        .toLowerCase()
        .split(" ")
        .forEach((word) => {
          if (word.length > 2) autoTags.add(word);
        });
    }

    // from category & subcategory
    if (body.category) autoTags.add(body.category.toLowerCase());
    if (body.subcategory) autoTags.add(body.subcategory.toLowerCase());

    // preserve incoming tags if any
    if (Array.isArray(body.tags)) {
      body.tags.forEach((t) => autoTags.add(t.toLowerCase()));
    }

    body.tags = Array.from(autoTags);

    // 7️⃣ 🎥 VIDEO UPLOAD (OPTIONAL — MAX 30 SEC)
    let videoData = {};

    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];

      const uploadedVideo = await cloudinary.uploader.upload(videoFile.path, {
        resource_type: "video",
        folder: "alinafe/videos",
      });

      // ✅ Thumbnail (Cloudinary way) - format safe
      const thumbnailUrl = cloudinary.url(uploadedVideo.public_id, {
        resource_type: "video",
        format: "jpg",
      });

      // ⛔ HARD LIMIT: 30 seconds (cleanup too)
      if (uploadedVideo.duration > 30) {
        // ✅ delete uploaded video to avoid junk
        await cloudinary.uploader.destroy(uploadedVideo.public_id, {
          resource_type: "video",
        });

        return res.status(400).json({
          success: false,
          message: "Video duration must be 30 seconds or less",
        });
      }

      videoData = {
        url: uploadedVideo.secure_url,
        thumbnail: thumbnailUrl,
        duration: uploadedVideo.duration,
        size: uploadedVideo.bytes,
        format: uploadedVideo.format,
        publicId: uploadedVideo.public_id,
      };
    }

    // 8️⃣ Create Ad
    const newAd = await Ad.create({
      ...body,
      images: imagePaths,
      video: videoData,
      status: "Pending",
      reportReason: "",
    });

    // Send ad posted email (non-blocking)
    if (body.ownerEmail) {
      EmailService.sendTemplate({
        to: body.ownerEmail,
        template: "AD_POSTED",
        data: {
          name: body.ownerName || "there",
          title: body.title || "your ad",
        },
      }).catch((err) => {
        console.error("Ad posted email failed:", err?.message || err);
      });
    }

    // 9️⃣ Update user city / location (safe)
    const updateFields = {};

    if (body.city && body.city.trim() !== "") {
      updateFields.city = body.city.trim();
    }

    if (body.location && body.location.trim() !== "") {
      updateFields.location = body.location.trim();
    }

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ uid: firebaseUser.uid }, { $set: updateFields });
    }

    // 🔟 Final response
    return res.status(201).json({
      success: true,
      message: "Ad submitted successfully and is pending admin approval.",
      ad: newAd,
    });
  } catch (error) {
    console.error("❌ CREATE AD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating ad",
    });
  }
};


/* ================================
   👤 GET USER ADS
================================ */
export const getUserAds = async (req, res) => {
  try {
    const { uid } = req.params;
    const requesterUid = req.user?.uid;
    const requesterRole = req.user?.role;

    if (!requesterUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requesterUid !== uid && requesterRole !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const ads = await Ad.find({ ownerUid: uid }).sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching user ads:", error);
    res.status(500).json({ message: "Server error" });
  }
};




/* ================================
   ⭐ GET PROMO ADS (HOMEPAGE)
   - Approved / Active only
   - Limited items
   - Lightweight fields
================================ */
export const getPromoAds = async (req, res) => {
  try {
    const { category, limit = 3 } = req.query;

    const filters = {
      status: { $in: ["Approved", "Active"] },
    };

    if (category) {
      filters.category = category;
    }

    const ads = await Ad.find(filters)
      .sort({ createdAt: -1 }) // latest first
      .limit(Number(limit))
      .select(
        "_id title price images condition city location ownerName"
      );


    res.status(200).json({
      success: true,
      ads,
    });
  } catch (error) {
    console.error("PROMO ADS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo ads",
    });
  }
};



/* ================================
   🌍 GET ALL ADS
================================ */
export const getAllAds = async (req, res) => {
  try {
    let {
      q = "",
      location = "",
      category,
      condition,
      page = 1,
      limit = 20,
    } = req.query;

    q = q.trim();
    location = location.trim();

    const filters = {
      status: { $in: ["Approved", "Active"] },
    };

    if (location) {
      filters.city = { $regex: `^${location}`, $options: "i" };
    }

    if (category) {
      filters.category = category;
    }

    if (condition && ["New", "Used"].includes(condition)) {
      filters.condition = condition;
    }

    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { subcategory: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      Ad.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title description price images category subcategory " +
            "city location " +
            "ownerName status views favouritesCount negotiable featured createdAt " +
            "condition brand model storage year mileage warranty " +
            " partCategory originalType workingStatus accessoryType vehicleType " +
            "bedrooms bathrooms area furnishing parking washroom roomType plotArea plotType facing  " +
            "salary experience company quantity serviceType availability serviceArea sportType weight brand " +
            "size color type " +
            "age breed gender " +
            "fileType accessType"
        ),
      Ad.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      ads,
    });
  } catch (err) {
    console.error("ADS FETCH ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
};


/* ================================
   ✏️ UPDATE AD
================================ */
export const updateAd = async (req, res) => {
  try {
    const updates = { ...req.body };

    // 🖼️ Update images
    const imagePaths = req.files?.images
      ? req.files.images.map((f) => f.path || f.secure_url)
      : [];

    if (imagePaths.length > 0) updates.images = imagePaths;

    /* ==================================================
       🔁 AUTO TAG UPDATE (IF TITLE / CATEGORY / SUBCATEGORY CHANGED)
    ================================================== */
    const updatedTags = new Set();

    // from title
    if (updates.title) {
      updates.title
        .toLowerCase()
        .split(" ")
        .forEach((word) => {
          if (word.length > 2) updatedTags.add(word);
        });
    }

    // from category & subcategory
    if (updates.category) updatedTags.add(updates.category.toLowerCase());
    if (updates.subcategory)
      updatedTags.add(updates.subcategory.toLowerCase());

    // preserve manual tags if any
    if (Array.isArray(updates.tags)) {
      updates.tags.forEach((t) => updatedTags.add(t.toLowerCase()));
    }

    if (updatedTags.size > 0) {
      updates.tags = Array.from(updatedTags);
    }

    // 🎥 Replace video if uploaded
    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];

      const uploadedVideo = await cloudinary.uploader.upload(videoFile.path, {
        resource_type: "video",
        folder: "alinafe/videos",
      });

      const thumbnailUrl = cloudinary.url(uploadedVideo.public_id, {
        resource_type: "video",
        format: "jpg",
      });

      if (uploadedVideo.duration > 30) {
        // ✅ delete uploaded video to avoid junk
        await cloudinary.uploader.destroy(uploadedVideo.public_id, {
          resource_type: "video",
        });

        return res.status(400).json({
          success: false,
          message: "Video duration must be 30 seconds or less",
        });
      }

      updates.video = {
        url: uploadedVideo.secure_url,
        thumbnail: thumbnailUrl,
        duration: uploadedVideo.duration,
        size: uploadedVideo.bytes,
        format: uploadedVideo.format,
        publicId: uploadedVideo.public_id,
      };
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ message: "Ad not found" });
    }

    res.status(200).json({
      message: "Ad updated successfully",
      ad: updatedAd,
    });
  } catch (error) {
    console.error("Error updating ad:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================================
   ❌ DELETE AD
================================ */
export const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    // 🗑️ Delete video from Cloudinary if exists
    if (ad.video?.publicId) {
      await cloudinary.uploader.destroy(ad.video.publicId, {
        resource_type: "video",
      });
    }

    await ad.deleteOne();
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   👁️ INCREMENT AD VIEW COUNT
================================ */
export const incrementView = async (req, res) => {
  try {
    const { userId, guestId } = req.body;
    const uniqueViewer = userId || guestId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Ad ID" });
    }

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (userId && ad.ownerUid === userId) {
      return res.json({ message: "Owner viewed — no increment" });
    }

    if (uniqueViewer && ad.viewedBy.includes(uniqueViewer)) {
      return res.json({ message: "Already viewed", views: ad.views });
    }

    ad.views = (ad.views || 0) + 1;
    if (uniqueViewer) ad.viewedBy.push(uniqueViewer);

    await ad.save();
    res.json({ message: "View incremented", views: ad.views });
  } catch (error) {
    console.error("❌ Error updating view count:", error);
    res.status(500).json({
      message: "Server error while updating view count",
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
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   🟣 GET SINGLE AD BY ID (WITH SELLER)
================================ */
export const getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    const seller = await User.findOne({ uid: ad.ownerUid }).select(
      "name email phone"
    );

    res.status(200).json({
      ...ad.toObject(),
      seller: seller || null,
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   ❤️ FAVORITES COUNT
================================ */
export const updateFavoriteCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    if (action === "add") ad.favouritesCount = (ad.favouritesCount || 0) + 1;
    if (action === "remove" && ad.favouritesCount > 0)
      ad.favouritesCount -= 1;

    await ad.save();
    res.status(200).json({
      message: "Favorites updated",
      favouritesCount: ad.favouritesCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================================
   🔎 SEARCH ADS
================================ */
export const searchAds = async (req, res) => {
  try {
    const { query, location } = req.query;

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






