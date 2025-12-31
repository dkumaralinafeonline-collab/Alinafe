import multer from "multer";

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // 🔥 File too large
    if (err.code === "LIMIT_FILE_SIZE") {
      // err.field often contains "video" or "images"
      const field = err.field || "";

      if (field === "video") {
        return res.status(400).json({
          success: false,
          message: "Video file is too large. Please upload a video under 50MB.",
        });
      }

      if (field === "images") {
        return res.status(400).json({
          success: false,
          message: "Image file is too large. Please upload images under 5MB each.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "File is too large. Please upload smaller images/video.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // custom fileFilter errors
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }

  next();
};

export default multerErrorHandler;
