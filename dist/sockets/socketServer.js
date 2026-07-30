"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
const socket_io_1 = require("socket.io");
const token_1 = require("../modules/auth/utils/token");
const Conversation_1 = require("../modules/chat/models/Conversation");
const Message_1 = require("../modules/chat/models/Message");
function initSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            credentials: true
        }
    });
    // JWT Handshake Auth
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication token required for Socket.IO"));
        }
        try {
            const payload = (0, token_1.verifyAccessToken)(token);
            if (payload.aud !== "omeetso-user") {
                return next(new Error("Token audience invalid for socket connection"));
            }
            socket.userId = payload.userId;
            next();
        }
        catch (err) {
            next(new Error("Invalid or expired socket access token"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.userId;
        console.log(`[Socket] User connected: ${userId} (${socket.id})`);
        // Auto-join user room
        socket.join(`user:${userId}`);
        // Join Conversation Room with Strict Membership Verification
        socket.on("conversation:join", async ({ conversationId }) => {
            try {
                const conversation = await Conversation_1.Conversation.findById(conversationId);
                if (!conversation) {
                    socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
                    return;
                }
                const isParticipant = conversation.participantIds.some((id) => id.toString() === userId);
                if (!isParticipant) {
                    socket.emit("error", { code: "FORBIDDEN", message: "Cannot join room of another user's conversation" });
                    return;
                }
                socket.join(`conversation:${conversationId}`);
                console.log(`[Socket] User ${userId} joined room conversation:${conversationId}`);
            }
            catch (err) {
                socket.emit("error", { code: "INTERNAL_ERROR", message: "Failed to join room" });
            }
        });
        socket.on("conversation:leave", ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });
        // Typing Indicators
        socket.on("typing:start", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId });
        });
        socket.on("typing:stop", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId });
        });
        // Real-Time Idempotent Message Sending
        socket.on("message:send", async (data) => {
            try {
                const { conversationId, clientMessageId, text, kind } = data;
                const conversation = await Conversation_1.Conversation.findById(conversationId);
                if (!conversation) {
                    socket.emit("message:error", { clientMessageId, message: "Conversation not found" });
                    return;
                }
                const isParticipant = conversation.participantIds.some((id) => id.toString() === userId);
                if (!isParticipant) {
                    socket.emit("message:error", { clientMessageId, message: "Access denied" });
                    return;
                }
                // Idempotency check: if clientMessageId exists for sender, return existing
                if (clientMessageId) {
                    const existing = await Message_1.Message.findOne({ senderId: userId, clientMessageId });
                    if (existing) {
                        socket.emit("message:ack", { clientMessageId, messageId: existing._id.toString(), status: "sent" });
                        return;
                    }
                }
                const recipientIds = conversation.participantIds.filter((id) => id.toString() !== userId);
                // Save to MongoDB first before emission
                const message = await Message_1.Message.create({
                    conversationId: conversation._id,
                    senderId: userId,
                    recipientIds,
                    clientMessageId,
                    kind: kind || "text",
                    text,
                    status: "sent"
                });
                // Update conversation metadata
                conversation.lastMessageText = text || "Sent an attachment";
                conversation.lastMessageAt = new Date();
                conversation.lastMessageSenderId = userId;
                await conversation.save();
                const messageDto = {
                    id: message._id.toString(),
                    conversationId: conversationId,
                    senderId: userId,
                    clientMessageId,
                    kind: message.kind,
                    text: message.text,
                    status: message.status,
                    createdAt: message.createdAt
                };
                // Emit to conversation room & recipient user room
                io.to(`conversation:${conversationId}`).emit("message:new", messageDto);
                recipientIds.forEach((rId) => {
                    io.to(`user:${rId.toString()}`).emit("notification:new", {
                        type: "chat_message",
                        title: "New Message",
                        body: text || "Sent an attachment",
                        conversationId
                    });
                });
                // Acknowledge sender
                socket.emit("message:ack", { clientMessageId, messageId: message._id.toString(), status: "sent" });
            }
            catch (err) {
                socket.emit("message:error", { clientMessageId: data.clientMessageId, message: "Failed to send message" });
            }
        });
        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${userId}`);
        });
    });
    return io;
}
