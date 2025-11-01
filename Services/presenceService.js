// services/presenceService.js
const onlineUsers = new Map(); // { userId -> socketId }
const typingMap = new Map();   // { "minId-maxId" -> { from, to, isTyping, updatedAt }}

function getChatKey(a, b) {
  return [a, b].sort().join("-");
}

// ONLINE STATUS
export function setUserOnline(userId, socketId) {
  onlineUsers.set(userId, socketId);
}

export function setUserOffline(userId) {
  onlineUsers.delete(userId);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

// TYPING
export function setTyping(fromId, toId, isTyping) {
  const key = getChatKey(fromId, toId);
  typingMap.set(key, {
    from: fromId,
    to: toId,
    isTyping,
    updatedAt: Date.now(),
  });
}

export function getTypingStatus(userA, userB) {
  const key = getChatKey(userA, userB);
  const data = typingMap.get(key);

  if (!data) return { isTyping: false, from: null };

  if (Date.now() - data.updatedAt > 5000) {
    typingMap.delete(key);
    return { isTyping: false, from: null };
  }

  return {
    isTyping: data.isTyping,
    from: data.from,
  };
}

export function getSocketId(userId) {
  return onlineUsers.get(userId) || null;
}
