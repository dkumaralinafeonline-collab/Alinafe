// 🌐 server.js — Zitheke Ads + Real-Time Chat Backend Server

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

import connectDB from "./config/db.js";

// ✅ Import Routes
import adRoutes from "./routes/adsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; // ✅ new


// ✅ Import Models
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

// ✅ Presence Helpers
import {
  setUserOnline,
  setUserOffline,
  setTyping,
  getSocketId,
} from "./Services/presenceService.js";

// 🧩 Load environment variables
dotenv.config();

// 🧠 Connect MongoDB
connectDB();

// ⚙️ Initialize Express
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://alinafe.netlify.app",
  "https://zitheke.netlify.app",
  "https://yourdomain.com",
];

// 🧩 Core Middlewares — must come before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);



// 🖼️ Static Uploads (kept for backward compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("📁 Created uploads folder at:", uploadsPath);
}
app.use("/uploads", express.static(uploadsPath));

// 🔍 Debug Middleware (only for development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ✅ API Routes
app.use("/api/ads", adRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/admin", adminRoutes); // ✅ add this line


// 🏠 Default Route
app.get("/", (req, res) => {
  res.send("🔥 Zitheke Ads + Chat API Running Successfully...");
});

// 🚫 404 Handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// 💥 Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

/* ================================
   🧩 SOCKET.IO — REAL-TIME CHAT
================================ */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ✅ Authenticate socket connection
io.use((socket, next) => {
  const uid = socket.handshake.auth?.uid;
  if (!uid) return next(new Error("Missing UID"));
  socket.userId = uid;
  next();
});

// ✅ Main socket logic
io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log(`🟢 User connected: ${userId}`);

  // 🔹 Mark user online
  setUserOnline(userId, socket.id);
  socket.join(userId);

  // 🔹 Deliver offline messages
  const pending = await Message.find({
    receiverId: userId,
    isDelivered: false,
  }).sort({ createdAt: 1 });

  if (pending.length > 0) {
    socket.emit("message:deliver-batch", pending);
    await Message.updateMany(
      { receiverId: userId, isDelivered: false },
      { $set: { isDelivered: true, deliveredAt: new Date() } }
    );
  }

  // 🔹 Typing indicator
  socket.on("typing:update", ({ fromId, toId, isTyping }) => {
    if (fromId !== userId) return;
    setTyping(fromId, toId, isTyping);
    const targetSocket = getSocketId(toId);
    if (targetSocket) {
      io.to(toId).emit("typing:status", { fromId, toId, isTyping });
    }
  });

  // 🔹 Send message (ack + db save)
  socket.on("message:send", async (msg, cb) => {
    try {
      if (msg.senderId !== userId)
        return cb({ success: false, error: "Unauthorized" });

      const {
        senderId,
        receiverId,
        senderName,
        senderEmail,
        senderPhoto,
        receiverName,
        receiverEmail,
        receiverPhoto,
        adTitle,
        message,
      } = msg;

      // 🔸 Find or create conversation
      const convo = await Conversation.findOneAndUpdate(
        {
          participants: { $all: [senderId, receiverId] },
          productTitle: adTitle || "Listing",
        },
        {
          $set: {
            lastMessage: message,
            lastSenderId: senderId,
            updatedAtSort: new Date(),
          },
          $inc: { [`unreadCounts.${receiverId}`]: 1 },
        },
        { upsert: true, new: true }
      );

      // 🔸 Save message
      const saved = await Message.create({
        conversationId: convo._id,
        senderId,
        receiverId,
        senderName,
        senderEmail,
        senderPhoto,
        receiverName,
        receiverEmail,
        receiverPhoto,
        adTitle: adTitle || "Listing",
        message,
        isRead: false,
        isDelivered: false,
      });

      // 🔸 Real-time delivery
      const receiverSocket = getSocketId(receiverId);
      if (receiverSocket) {
        io.to(receiverId).emit("message:new", saved);
        await Message.updateOne(
          { _id: saved._id },
          { $set: { isDelivered: true, deliveredAt: new Date() } }
        );
      }

      cb({ success: true, message: saved });
    } catch (err) {
      console.error("❌ message:send error:", err);
      cb({ success: false, error: err.message });
    }
  });

  // 🔹 Handle disconnect
  socket.on("disconnect", () => {
    setUserOffline(userId);
    console.log(`🔴 User disconnected: ${userId}`);
  });
});

/* ================================
   🚀 START SERVER
================================ */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Zitheke Backend & Chat Server running on port ${PORT}`)
);

// 🧹 Graceful shutdown (optional but clean)
process.on("SIGINT", async () => {
  console.log("🔴 Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
