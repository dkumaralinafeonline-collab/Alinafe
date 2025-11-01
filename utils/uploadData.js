import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Product from "../models/Product.js";
import connectDB from "../config/db.js";

dotenv.config();
await connectDB();

const products = JSON.parse(fs.readFileSync("products.json", "utf-8"));

const importData = async () => {
  try {
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log("✅ Data imported successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
};

importData();
