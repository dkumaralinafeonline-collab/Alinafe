// models/PhoneOtp.js
import mongoose from "mongoose";

const phoneOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PhoneOtp = mongoose.model("PhoneOtp", phoneOtpSchema);
export default PhoneOtp;
