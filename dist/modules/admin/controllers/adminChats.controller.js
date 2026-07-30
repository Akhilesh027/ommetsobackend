"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminConversations = getAdminConversations;
exports.getAdminConversationMessages = getAdminConversationMessages;
exports.flagAdminConversation = flagAdminConversation;
exports.sendAdminWarningMessage = sendAdminWarningMessage;
const Conversation_1 = require("../../chat/models/Conversation");
const Message_1 = require("../../chat/models/Message");
const Notification_1 = require("../../notifications/models/Notification");
const socket_server_1 = require("../../../sockets/socket-server");
async function getAdminConversations(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const { contextType, q, flaggedOnly } = req.query;
        const filter = {};
        if (contextType && contextType !== "ALL") {
            filter.contextType = contextType.toUpperCase();
        }
        if (flaggedOnly === "true") {
            filter.isFlagged = true;
        }
        const totalConversations = await Conversation_1.Conversation.countDocuments(filter);
        const rawConversations = await Conversation_1.Conversation.find(filter)
            .populate("listingId", "title priceInPaise images status")
            .populate("storeId", "name logo cover category")
            .populate("participantIds", "profile.name profile.avatar email phone")
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const items = rawConversations.map((c) => {
            const participants = (c.participantIds || []).map((p) => ({
                id: p._id?.toString(),
                name: p.profile?.name || p.email || "Unknown User",
                email: p.email,
                phone: p.phone,
                avatar: p.profile?.avatar
            }));
            return {
                id: c._id.toString(),
                contextType: c.contextType || "LISTING",
                contextId: c.contextId?.toString(),
                listing: c.listingId
                    ? {
                        id: c.listingId._id?.toString(),
                        title: c.listingId.title,
                        priceInPaise: c.listingId.priceInPaise,
                        image: c.listingId.images?.[0]
                    }
                    : undefined,
                store: c.storeId
                    ? {
                        id: c.storeId._id?.toString(),
                        name: c.storeId.name,
                        logo: c.storeId.logo
                    }
                    : undefined,
                participants,
                lastMessagePreview: c.lastMessagePreview || "No messages",
                lastMessageType: c.lastMessageType || "TEXT",
                lastMessageAt: c.lastMessageAt || c.updatedAt || c.createdAt,
                unreadCounts: c.unreadCounts || [],
                isFlagged: Boolean(c.isFlagged),
                flagReason: c.flagReason || null,
                status: c.status || "ACTIVE"
            };
        });
        let finalItems = items;
        if (q && typeof q === "string" && q.trim().length > 0) {
            const search = q.toLowerCase();
            finalItems = items.filter((item) => item.id.toLowerCase().includes(search) ||
                item.listing?.title?.toLowerCase().includes(search) ||
                item.store?.name?.toLowerCase().includes(search) ||
                item.participants.some((p) => p.name?.toLowerCase().includes(search) || p.email?.toLowerCase().includes(search)) ||
                item.lastMessagePreview?.toLowerCase().includes(search));
        }
        res.status(200).json({
            success: true,
            data: finalItems,
            pagination: {
                total: totalConversations,
                page,
                limit,
                pages: Math.ceil(totalConversations / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminConversationMessages(req, res, next) {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation_1.Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
            return;
        }
        const messages = await Message_1.Message.find({ conversationId })
            .populate("senderId", "profile.name profile.avatar email")
            .populate("offerId")
            .sort({ createdAt: 1 })
            .lean();
        const items = messages.map((m) => ({
            id: m._id.toString(),
            clientMessageId: m.clientMessageId,
            conversationId: m.conversationId.toString(),
            sender: {
                id: m.senderId?._id?.toString(),
                name: m.senderId?.profile?.name || m.senderId?.email || "User",
                avatar: m.senderId?.profile?.avatar
            },
            type: m.type || "TEXT",
            text: m.text,
            imageUrl: m.imageUrl,
            offer: m.offerId
                ? {
                    id: m.offerId._id.toString(),
                    amountInPaise: m.offerId.amountInPaise,
                    originalPriceInPaise: m.offerId.originalPriceInPaise,
                    status: m.offerId.status
                }
                : undefined,
            status: m.status || "SENT",
            sentAt: m.sentAt || m.createdAt,
            createdAt: m.createdAt
        }));
        res.status(200).json({
            success: true,
            data: items
        });
    }
    catch (error) {
        next(error);
    }
}
async function flagAdminConversation(req, res, next) {
    try {
        const { conversationId } = req.params;
        const { isFlagged, flagReason } = req.body;
        const conversation = await Conversation_1.Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
            return;
        }
        conversation.isFlagged = Boolean(isFlagged);
        if (flagReason) {
            conversation.flagReason = flagReason;
        }
        await conversation.save();
        res.status(200).json({
            success: true,
            data: {
                id: conversation._id.toString(),
                isFlagged: conversation.isFlagged,
                flagReason: conversation.flagReason
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function sendAdminWarningMessage(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { conversationId } = req.params;
        const { warningText } = req.body;
        if (!warningText || warningText.trim().length === 0) {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Warning text is required" } });
            return;
        }
        const conversation = await Conversation_1.Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
            return;
        }
        const clientMessageId = `admin_warning_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const message = await Message_1.Message.create({
            conversationId: conversation._id,
            clientMessageId,
            senderId: req.admin._id,
            recipientIds: conversation.participantIds,
            type: "SYSTEM",
            text: warningText,
            status: "SENT",
            sentAt: new Date()
        });
        conversation.lastMessageId = message._id;
        conversation.lastMessagePreview = `⚠️ Moderator Warning: ${warningText.substring(0, 40)}...`;
        conversation.lastMessageType = "SYSTEM";
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();
        const msgPayload = {
            id: message._id.toString(),
            clientMessageId: message.clientMessageId,
            conversationId: conversation._id.toString(),
            senderId: req.admin._id.toString(),
            type: "SYSTEM",
            text: message.text,
            status: message.status,
            sentAt: message.sentAt,
            createdAt: message.createdAt
        };
        const io = (0, socket_server_1.getIO)();
        for (const pId of conversation.participantIds) {
            const notif = await Notification_1.Notification.create({
                userId: pId,
                type: "system",
                title: "⚠️ Safety Warning from Omeetso Moderator",
                body: warningText,
                link: `/chat/${conversation._id}`
            });
            if (io) {
                io.to(`user:${pId.toString()}`).emit("message:new", msgPayload);
                io.to(`user:${pId.toString()}`).emit("notification:new", notif);
            }
        }
        if (io) {
            io.to(`conversation:${conversation._id.toString()}`).emit("message:new", msgPayload);
            io.to("admin:monitoring").emit("admin:message:new", {
                ...msgPayload,
                contextType: conversation.contextType,
                contextId: conversation.contextId,
                senderName: `Admin: ${req.admin.name}`
            });
        }
        res.status(201).json({
            success: true,
            data: msgPayload
        });
    }
    catch (error) {
        next(error);
    }
}
