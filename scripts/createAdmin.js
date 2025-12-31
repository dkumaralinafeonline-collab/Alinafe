import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const email = process.env.ADMIN_EMAIL.toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const hashed = await bcrypt.hash(password, 10);

await Admin.create({
  email,
  password: hashed,
  role: "admin",
});

console.log("✅ Admin recreated with bcrypt");
process.exit(0);
