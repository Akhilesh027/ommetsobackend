"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.getMyTickets = getMyTickets;
exports.getTicketMessages = getTicketMessages;
exports.addTicketMessage = addTicketMessage;
exports.getAdminSupportTickets = getAdminSupportTickets;
const SupportTicket_1 = require("../models/SupportTicket");
const SupportMessage_1 = require("../models/SupportMessage");
const contracts_1 = require("@omeetso/contracts");
async function createTicket(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { subject, category, message, priority, attachments } = req.body;
        const ticket = await SupportTicket_1.SupportTicket.create({
            userId: req.user._id,
            subject,
            category: category || "general",
            priority: priority || contracts_1.SupportPriority.MEDIUM,
            status: contracts_1.SupportStatus.OPEN,
            lastMessageAt: new Date()
        });
        await SupportMessage_1.SupportMessage.create({
            ticketId: ticket._id,
            senderType: "user",
            senderUserId: req.user._id,
            senderName: req.user.profile.name,
            text: message,
            attachments: attachments || []
        });
        res.status(201).json({
            success: true,
            data: {
                id: ticket._id.toString(),
                subject: ticket.subject,
                status: ticket.status,
                createdAt: ticket.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyTickets(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const tickets = await SupportTicket_1.SupportTicket.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: tickets.map((t) => ({
                id: t._id.toString(),
                subject: t.subject,
                category: t.category,
                priority: t.priority,
                status: t.status,
                updatedAt: t.updatedAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
async function getTicketMessages(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { ticketId } = req.params;
        const ticket = await SupportTicket_1.SupportTicket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
            return;
        }
        if (ticket.userId.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied to ticket" } });
            return;
        }
        const messages = await SupportMessage_1.SupportMessage.find({ ticketId: ticket._id })
            .sort({ createdAt: 1 })
            .lean();
        res.status(200).json({
            success: true,
            data: messages.map((m) => ({
                id: m._id.toString(),
                senderType: m.senderType,
                senderName: m.senderName,
                text: m.text,
                attachments: m.attachments,
                createdAt: m.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
async function addTicketMessage(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { ticketId } = req.params;
        const { text, attachments } = req.body;
        const ticket = await SupportTicket_1.SupportTicket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
            return;
        }
        const msg = await SupportMessage_1.SupportMessage.create({
            ticketId: ticket._id,
            senderType: "user",
            senderUserId: req.user._id,
            senderName: req.user.profile.name,
            text,
            attachments: attachments || []
        });
        ticket.lastMessageAt = new Date();
        if (ticket.status === contracts_1.SupportStatus.RESOLVED || ticket.status === contracts_1.SupportStatus.CLOSED) {
            ticket.status = contracts_1.SupportStatus.REOPENED;
        }
        await ticket.save();
        res.status(201).json({
            success: true,
            data: {
                id: msg._id.toString(),
                text: msg.text,
                createdAt: msg.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminSupportTickets(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status)
            query.status = req.query.status;
        const [tickets, total] = await Promise.all([
            SupportTicket_1.SupportTicket.find(query)
                .populate("userId", "profile.name email phone")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SupportTicket_1.SupportTicket.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            data: tickets.map((t) => ({
                id: t._id.toString(),
                subject: t.subject,
                category: t.category,
                priority: t.priority,
                status: t.status,
                updatedAt: t.updatedAt,
                user: t.userId
                    ? {
                        id: t.userId._id.toString(),
                        name: t.userId.profile?.name,
                        email: t.userId.email,
                        phone: t.userId.phone
                    }
                    : undefined
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
}
