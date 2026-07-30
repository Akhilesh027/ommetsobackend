"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../modules/users/models/User");
const AdminUser_1 = require("../modules/admin/models/AdminUser");
const Message_1 = require("../modules/chat/models/Message");
const Conversation_1 = require("../modules/chat/models/Conversation");
let io = null;
function initSocketServer(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    // JWT Authentication Middleware (User or Admin)
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            if (decoded.aud === "omeetso-admin" && decoded.adminId) {
                const admin = await AdminUser_1.AdminUser.findById(decoded.adminId).select("_id email role").lean();
                if (!admin) {
                    return next(new Error("Admin user not found"));
                }
                socket.isAdmin = true;
                socket.adminId = admin._id.toString();
                return next();
            }
            if (decoded.userId) {
                const user = await User_1.User.findById(decoded.userId).select("_id name email").lean();
                if (!user) {
                    return next(new Error("User not found"));
                }
                socket.userId = user._id.toString();
                return next();
            }
            return next(new Error("Invalid token payload"));
        }
        catch (err) {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const isAdmin = socket.isAdmin;
        const adminId = socket.adminId;
        const userId = socket.userId;
        if (isAdmin) {
            console.log(`[Socket] Admin connected: ${adminId}`);
            // Join admin monitoring room automatically or on demand
            socket.join("admin:monitoring");
            socket.on("admin:join_monitoring", () => {
                socket.join("admin:monitoring");
            });
            socket.on("admin:leave_monitoring", () => {
                socket.leave("admin:monitoring");
            });
            socket.on("admin:inspect_conversation", ({ conversationId }) => {
                if (conversationId) {
                    socket.join(`conversation:${conversationId}`);
                }
            });
            return;
        }
        if (!userId)
            return;
        // Join Personal User Room for notifications
        socket.join(`user:${userId}`);
        // Join Specific Conversation Room
        socket.on("conversation:join", ({ conversationId }) => {
            if (conversationId) {
                socket.join(`conversation:${conversationId}`);
            }
        });
        socket.on("conversation:leave", ({ conversationId }) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });
        // Typing Indicators (In-Memory Only)
        socket.on("typing:start", ({ conversationId, recipientId }) => {
            if (conversationId && recipientId) {
                io?.to(`user:${recipientId}`).emit("typing:start", { conversationId, userId });
            }
        });
        socket.on("typing:stop", ({ conversationId, recipientId }) => {
            if (conversationId && recipientId) {
                io?.to(`user:${recipientId}`).emit("typing:stop", { conversationId, userId });
            }
        });
        // Message Acknowledgment (Delivery Confirmation)
        socket.on("message:ack", async ({ messageId }) => {
            try {
                if (!messageId)
                    return;
                const msg = await Message_1.Message.findById(messageId);
                if (msg && msg.status === "SENT") {
                    msg.status = "DELIVERED";
                    msg.deliveredAt = new Date();
                    await msg.save();
                    io?.to(`user:${msg.senderId.toString()}`).emit("message:delivered", {
                        messageId: msg._id.toString(),
                        conversationId: msg.conversationId.toString(),
                        deliveredAt: msg.deliveredAt
                    });
                }
            }
            catch (e) { }
        });
        // Message Read Receipt
        socket.on("message:read", async ({ conversationId }) => {
            try {
                if (!conversationId)
                    return;
                const conv = await Conversation_1.Conversation.findById(conversationId);
                if (!conv)
                    return;
                // Update unread count for this user to 0
                const updatedCounts = conv.unreadCounts.map((uc) => {
                    if (uc.userId.toString() === userId) {
                        return { userId: uc.userId, count: 0 };
                    }
                    return uc;
                });
                conv.unreadCounts = updatedCounts;
                await conv.save();
                // Mark all messages as read
                await Message_1.Message.updateMany({ conversationId, senderId: { $ne: userId }, status: { $ne: "READ" } }, { $set: { status: "READ", readAt: new Date() } });
                // Notify other participants
                conv.participantIds.forEach((pId) => {
                    if (pId.toString() !== userId) {
                        io?.to(`user:${pId.toString()}`).emit("message:read", {
                            conversationId,
                            readByUserId: userId,
                            readAt: new Date()
                        });
                    }
                });
            }
            catch (e) { }
        });
        socket.on("disconnect", () => {
            // Clean disconnect
        });
    });
    return io;
}
function getIO() {
    return io;
}
