// controllers/messageController.js
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { EmailService } from "../Services/email.service.js";

/* =====================================================
   🔹 Helpers
===================================================== */

const ALLOWED_TYPES = new Set(["text", "image", "video", "pdf", "file", "deleted"]);
const MAX_TEXT_LENGTH = 2000;

// simple per-user rate guard (in-memory)
const RATE_WINDOW_MS = 1200; // 1.2s
const lastSendAt = new Map();

function requireAuthUid(req) {
  const uid = req?.user?.uid;
  if (!uid) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return uid;
}

async function requireConversationParticipant(conversationId, uid) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const err = new Error("Invalid conversationId");
    err.statusCode = 400;
    throw err;
  }

  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  if (!convo.participants?.includes(uid)) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  return convo;
}

function parseBefore(before) {
  if (!before) return new Date();
  const asNum = Number(before);
  const d = Number.isFinite(asNum) ? new Date(asNum) : new Date(before);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

function parseLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return 30;
  return Math.max(1, Math.min(100, Math.floor(n)));
}

/* =====================================================
   🔹 GET MESSAGES (PAGINATION + DELETE LOGIC)
   query: before (timestamp or date) + limit
===================================================== */
export const getMessagesByConversation = async (req, res) => {
  try {
    const authUid = requireAuthUid(req);
    const { conversationId } = req.params;

    await requireConversationParticipant(conversationId, authUid);

    const before = parseBefore(req.query.before);
    const limit = parseLimit(req.query.limit);

    const msgsDesc = await Message.find({
      conversationId,
      deletedFor: { $ne: authUid },
      createdAt: { $lt: before },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // oldest -> newest
    const msgs = msgsDesc.reverse();

    const normalized = msgs.map((m) => {
      if (m.isDeleted || m.type === "deleted") {
        return {
          _id: m._id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          receiverId: m.receiverId,
          type: "deleted",
          message: "This message was deleted",
          mediaUrl: "",
          createdAt: m.createdAt,
          isDeleted: true,
          deletedAt: m.deletedAt || m.updatedAt || null,

          // delivery/read fields passthrough
          isDelivered: !!m.isDelivered,
          deliveredAt: m.deliveredAt || null,
          isRead: !!m.isRead,
          readAt: m.readAt || null,

          // optimistic UI passthrough (requires schema field to persist)
          clientTempId: m.clientTempId || null,
        };
      }

      return m;
    });

    res.status(200).json(normalized);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

/* =====================================================
   🔹 SEND MESSAGE (PAGINATION READY + DEDUPE + DELIVERY/READ DEFAULTS)
   - accept clientTempId, return clientTempId
   - strict sender auth
   - validation: type allowlist, length, mediaUrl required for media
   - rate guard
===================================================== */
export const saveMessage = async (req, res) => {
  try {
    const authUid = requireAuthUid(req);

    const {
      receiverId,
      message,
      mediaUrl,
      type,
      adId,
      productTitle,
      productImage,
      clientTempId,
    } = req.body;
    const senderId = authUid;

    // ✅ strict auth
    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }

    if (receiverId === senderId) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }

    // ✅ rate guard
    const now = Date.now();
    const last = lastSendAt.get(authUid) || 0;
    if (now - last < RATE_WINDOW_MS) {
      return res.status(429).json({ error: "Too many requests" });
    }
    lastSendAt.set(authUid, now);

    // ✅ validate type
    const msgType = (type || "text").toLowerCase();
    if (!ALLOWED_TYPES.has(msgType) || msgType === "deleted") {
      return res.status(400).json({ error: "Invalid message type" });
    }

    // ✅ validate content
    const text = typeof message === "string" ? message.trim() : "";
    const hasMedia = ["image", "video", "pdf", "file"].includes(msgType);

    if (msgType === "text") {
      if (!text) return res.status(400).json({ error: "Message is required" });
      if (text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({ error: `Message too long (max ${MAX_TEXT_LENGTH})` });
      }
    }

    if (hasMedia) {
      if (!mediaUrl || typeof mediaUrl !== "string") {
        return res.status(400).json({ error: "mediaUrl is required for media messages" });
      }
      if (text && text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({ error: `Message too long (max ${MAX_TEXT_LENGTH})` });
      }
    }

    // ✅ FIND CONVERSATION (participants + adId)
    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      adId: adId || null,
    });
    const isNewConversation = !convo;

    const lastMessageText = msgType === "text" ? text : `[${msgType}]`;

    // ✅ CREATE CONVERSATION (ONLY ONCE)
    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverId],

        adId: adId || null,
        productTitle: productTitle || "Listing",
        productImage: productImage || "",

        unreadCounts: {
          [senderId]: 0,
          [receiverId]: 1,
        },

        lastMessage: lastMessageText,
        lastMessageType: msgType,
        lastSenderId: senderId,
        updatedAtSort: new Date(),
      });
    } else {
      // ✅ UPDATE EXISTING CONVERSATION
      await Conversation.updateOne(
        { _id: convo._id },
        {
          $set: {
            lastMessage: lastMessageText,
            lastMessageType: msgType,
            lastSenderId: senderId,
            updatedAtSort: new Date(),
          },
          $inc: {
            [`unreadCounts.${receiverId}`]: 1,
          },
        }
      );
    }

    // ✅ SAVE MESSAGE (delivery/read defaults)
    const baseDoc = {
      conversationId: convo._id,
      receiverId,
      message: msgType === "text" ? text : (text || ""),
      mediaUrl: hasMedia ? mediaUrl : "",
      type: msgType,

      isDeleted: false,
      deletedFor: [],

      isDelivered: false,
      deliveredAt: null,
      isRead: false,
      readAt: null,

      // optimistic UI (requires schema field to persist; will still be returned)
      clientTempId: clientTempId || null,
    };

    const newMsg = await Message.create(baseDoc);

    // --- Email notifications (non-blocking) ---
    const isCallbackRequest =
      msgType === "text" &&
      text.toLowerCase().includes("request call back");

    if (isNewConversation || isCallbackRequest) {
      Promise.all([
        User.findOne({ uid: receiverId }).lean(),
        User.findOne({ uid: senderId }).lean(),
      ])
        .then(([receiverUser, senderUser]) => {
          const toEmail = receiverUser?.email;
          if (!toEmail) return;

          const senderName =
            req.body?.senderName ||
            senderUser?.name ||
            "Someone";

          const sellerName = receiverUser?.name || "there";
          const title = productTitle || "your listing";

          if (isCallbackRequest) {
            const phoneMatch = text.match(/Phone:\s*([\s\S]*?)\n/i);
            const messageMatch = text.match(/Message:\s*([\s\S]*)$/i);

            EmailService.sendTemplate({
              to: toEmail,
              template: "CALLBACK_REQUESTED",
              data: {
                name: sellerName,
                senderName,
                title,
                phone: phoneMatch?.[1]?.trim() || "",
                message: messageMatch?.[1]?.trim() || "",
              },
            }).catch((err) => {
              console.error("Callback email failed:", err?.message || err);
            });
            return;
          }

          if (isNewConversation) {
            EmailService.sendTemplate({
              to: toEmail,
              template: "CHAT_STARTED",
              data: {
                name: sellerName,
                senderName,
                title,
              },
            }).catch((err) => {
              console.error("Chat started email failed:", err?.message || err);
            });
          }
        })
        .catch(() => {});
    }

    // ✅ Emit "new message" + try delivery ack flow
    // Assumption: receiver joins a room named by their uid: io.to(receiverId)
    const payload = {
      ...newMsg.toObject(),
      clientTempId: clientTempId || null,
    };

    if (req.io?.to) {
      // send to receiver room only to avoid duplicate events
      try {
        req.io
          .to(receiverId)
          .timeout(2500)
          .emit("message:new", payload, async (err) => {
            if (err) return; // no ack

            const deliveredAt = new Date();
            await Message.updateOne(
              { _id: newMsg._id },
              { $set: { isDelivered: true, deliveredAt } }
            );

            req.io.to(convo._id.toString()).emit("message:delivered", {
              messageId: newMsg._id.toString(),
              receiverId,
              deliveredAt,
            });
          });
      } catch (e) {
        // ignore ack failures
      }
    }

    // ✅ response includes clientTempId so frontend can replace temp message
    res.status(201).json({
      ...newMsg.toObject(),
      clientTempId: clientTempId || null,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

/* =====================================================
   🔹 DELETE FOR EVERYONE (CLEANUP + LAST MESSAGE FIX)
   - if deleted message is last message -> update conversation lastMessage fields
===================================================== */
export const deleteForEveryone = async (req, res) => {
  try {
    const authUid = requireAuthUid(req);
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid messageId" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.senderId !== authUid) {
      return res.status(403).json({ error: "Access denied" });
    }

    const convo = await requireConversationParticipant(msg.conversationId, authUid);

    // cloudinary cleanup (best-effort)
    if (msg.mediaUrl) {
      try {
        const file = msg.mediaUrl.split("/").pop();
        const publicId = file?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: msg.type === "video" ? "video" : "image",
          });
        }
      } catch (e) {
        console.warn("Cloudinary delete failed");
      }
    }

    msg.isDeleted = true;
    msg.message = "";
    msg.mediaUrl = "";
    msg.type = "deleted";
    msg.deletedAt = new Date();
    msg.deletedFor = [];

    await msg.save();

    // ✅ if this was last message, recalc lastMessage from latest non-deleted
    const wasLast =
      (convo?.lastMessage && convo?.lastSenderId) &&
      true; // keep simple (we'll still recompute safely)

    if (wasLast) {
      const latest = await Message.findOne({
        conversationId: msg.conversationId,
        isDeleted: { $ne: true },
        type: { $ne: "deleted" },
      })
        .sort({ createdAt: -1 })
        .lean();

      const nextLastMessage = latest
        ? (latest.type === "text" ? (latest.message || "").trim() : `[${latest.type}]`)
        : "";

      const nextLastMessageType = latest ? latest.type : "text";
      const nextLastSenderId = latest ? latest.senderId : null;

      await Conversation.updateOne(
        { _id: msg.conversationId },
        {
          $set: {
            lastMessage: nextLastMessage,
            lastMessageType: nextLastMessageType,
            lastSenderId: nextLastSenderId,
            updatedAtSort: new Date(),
          },
        }
      );
    } else {
      await Conversation.updateOne(
        { _id: msg.conversationId },
        { $set: { updatedAtSort: new Date() } }
      );
    }

    req.io?.to(msg.conversationId.toString()).emit("message:deleted-everyone", msg._id.toString());

    res.json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

/* =====================================================
   🔹 DELETE FOR ME ONLY
===================================================== */
export const deleteForMe = async (req, res) => {
  try {
    const authUid = requireAuthUid(req);
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid messageId" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    await requireConversationParticipant(msg.conversationId, authUid);

    await Message.updateOne({ _id: messageId }, { $addToSet: { deletedFor: authUid } });

    res.json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
