// 🌐 server.js — Alinafe + Zitheke Real-Time Chat + Ads Backend

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

// ROUTES
import adRoutes from "./routes/adsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminMessageRoutes from "./routes/adminMessageRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import sellerStatsRoutes from "./routes/sellerStatsRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import trendingRoutes from "./routes/trending.routes.js";
  



// MODELS
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import User from "./models/User.js";

// Presence utilities
import {
  setUserOnline,
  setUserOffline,
  setTyping,
  getSocketId
} from "./Services/presenceService.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// allowed frontends
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://alinafe.netlify.app",
  "https://zitheke.netlify.app",
  "https://zitheke-admin.netlify.app",
  "https://alinafe-admin.netlify.app",
];

// BODY PARSERS
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// GLOBAL CORS
app.use((req, res, next) => {
  const origin = allowedOrigins.includes(req.headers.origin)
    ? req.headers.origin
    : "*";

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// STATIC UPLOADS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

app.use("/uploads", express.static(uploadsPath));

// ROUTES
app.use("/api/ads", adRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminMessageRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sellers", sellerStatsRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/trending", trendingRoutes); // 👈 here



app.get("/", (req, res) => res.send("🔥 Alinafe + Zitheke API Running"));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ===============================
//       SOCKET.IO v4.8.1
// ===============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT"],
  },
});

// AUTH SOCKET
io.use((socket, next) => {
  const uid = socket.handshake.auth?.uid;
  if (!uid) return next(new Error("Missing UID"));
  socket.userId = uid;
  next();
});

// SOCKET CONNECTION
io.on("connection", async (socket) => {
  const userId = socket.userId;

  console.log(`🟢 User Connected: ${userId}`);
  setUserOnline(userId, socket.id);

  await User.updateOne({ uid: userId }, { lastSeen: new Date() });

  // Personal room = DM delivery
  socket.join(userId);

  // Deliver offline messages
  const offline = await Message.find({
    receiverId: userId,
    isDelivered: false,
  }).sort({ createdAt: 1 });

  if (offline.length > 0) {
    socket.emit("message:batch-deliver", offline);

    await Message.updateMany(
      { receiverId: userId, isDelivered: false },
      { isDelivered: true, deliveredAt: new Date() }
    );
  }

  // Join chat room
  socket.on("conversation:join", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("conversation:leave", (conversationId) => {
    socket.leave(conversationId);
  });

  // =========================================================
  // 🔵 FIXED TYPING INDICATOR (WORKS 100%)
  // =========================================================
  socket.on("typing:update", ({ fromId, toId, isTyping }) => {
    setTyping(fromId, toId, isTyping);

    const receiverSocket = getSocketId(toId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing:status", {
        fromId,
        toId,
        isTyping,
      });
    }
  });

  // =========================================================
  // SEND MESSAGE — fixed conversationId issue
  // =========================================================
// SEND MESSAGE — text + image + video + pdf + file
socket.on("message:send", async (msg, cb) => {
  try {
    if (msg.senderId !== userId) {
      return cb({ success: false, error: "Unauthorized" });
    }

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
      type,
      mediaUrl,
      mediaName,
      mediaThumbnail,
    } = msg;

    // 🧠 Decide what to show in conversation preview
    let previewText = message || "";
    if (type && type !== "text") {
      if (type === "image") previewText = "[Photo]";
      else if (type === "video") previewText = "[Video]";
      else if (type === "pdf") previewText = mediaName || "[PDF]";
      else previewText = mediaName || "[Attachment]";
    }

    // 1️⃣ Find or create conversation
    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      productTitle: adTitle || "Listing",
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverId],
        productTitle: adTitle || "Listing",
        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 1,
        },
        lastMessage: previewText,
        lastSenderId: senderId,
        updatedAtSort: new Date(),
      });
    } else {
      convo.lastMessage = previewText;
      convo.lastSenderId = senderId;
      convo.updatedAtSort = new Date();
      convo.unreadCounts[receiverId] =
        (convo.unreadCounts[receiverId] || 0) + 1;
      await convo.save();
    }

    // 2️⃣ Save full message with media fields
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
      message: message || "",
      type: type || "text",
      mediaUrl: mediaUrl || "",
      mediaName: mediaName || "",
      mediaThumbnail: mediaThumbnail || "",
      isRead: false,
      isDelivered: false,
    });

    // 3️⃣ Deliver to receiver if online
    const receiverSocket = getSocketId(receiverId);
    if (receiverSocket) {
      io.to(receiverId).emit("message:new", saved);

      await Message.updateOne(
        { _id: saved._id },
        { isDelivered: true, deliveredAt: new Date() }
      );
    }

    cb({ success: true, message: saved });
  } catch (err) {
    console.error("❌ message:send error:", err);
    cb({ success: false, error: err.message });
  }
});


  // Mark seen
  socket.on("message:seen", async ({ conversationId, userId }) => {
    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    io.to(conversationId).emit("message:update-seen", { userId });
  });

  // Delete for everyone
  socket.on("message:delete-everyone", async (msgId) => {
    await Message.updateOne(
      { _id: msgId },
      { isDeleted: true, message: "", mediaUrl: "" }
    );

    io.emit("message:deleted-everyone", msgId);
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log(`🔴 User disconnected: ${userId}`);
    setUserOffline(userId);

    await User.updateOne({ uid: userId }, { lastSeen: new Date() });
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Alinafe/Zitheke Server running on PORT ${PORT}`)
);

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🔻 Closing Server...");
  await mongoose.connection.close();
  process.exit(0);
});
