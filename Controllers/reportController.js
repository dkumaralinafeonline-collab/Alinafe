import Report from "../models/Report.js";

// ✅ Create a new report
export const createReport = async (req, res) => {
  try {
    const {
      adId,
      adTitle,
      sellerId,
      reporterId,
      reporterName,
      reason,
      message,
    } = req.body;

    if (!adId || !reporterId || !reason || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let fileUrl = "";
    if (req.file && req.file.path) fileUrl = req.file.path;

    const newReport = await Report.create({
      adId,
      adTitle,
      sellerId,
      reporterId,
      reporterName,
      reason,
      message,
      fileUrl,
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: newReport,
    });
  } catch (err) {
    console.error("❌ Error submitting report:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
};

// ✅ Get all reports (for admin)
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ error: "Error fetching reports" });
  }
};
// ✅ controllers/reportController.js
export const getUserReports = async (req, res) => {
    try {
      const { userId } = req.params;
      const reports = await Report.find({ reporterId: userId }).sort({ createdAt: -1 });
  
      // Return a direct array instead of wrapping in {data: ...}
      res.status(200).json(reports);
    } catch (err) {
      console.error("❌ Error fetching user reports:", err);
      res.status(500).json({ error: "Error fetching user reports" });
    }
  };
  


// ✅ controllers/reportController.js
export const getReportById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const report = await Report.findById(id)
        .populate({
          path: "adId",
          select:
            "title description price location images ownerUid ownerName ownerEmail ownerPhone createdAt",
          strictPopulate: false, // 👈 prevents sellerId populate error
        })
        .lean();
  
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
  
      return res.status(200).json({ success: true, data: report });
    } catch (err) {
      console.error("❌ Error fetching report by id:", err);
      return res.status(500).json({ error: "Error fetching report" });
    }
  };
  



  // ✅ Update report status
export const updateReportStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
  
      const updated = await Report.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!updated) return res.status(404).json({ message: "Report not found" });
  
      res.status(200).json({
        success: true,
        message: "Status updated successfully",
        status: updated.status,
      });
    } catch (err) {
      console.error("❌ Error updating report:", err);
      res.status(500).json({ error: "Failed to update report" });
    }
  };
  
  // ✅ Delete report
  export const deleteReport = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Report.findByIdAndDelete(id);
      if (!deleted)
        return res.status(404).json({ message: "Report not found" });
  
      res.status(200).json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (err) {
      console.error("❌ Error deleting report:", err);
      res.status(500).json({ error: "Failed to delete report" });
    }
  };
  