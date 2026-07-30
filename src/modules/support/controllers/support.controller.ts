import { Request, Response, NextFunction } from "express";
import { SupportTicket } from "../models/SupportTicket";
import { SupportMessage } from "../models/SupportMessage";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { AuthenticatedAdminRequest } from "../../../middleware/authenticateAdmin";
import { SupportPriority, SupportStatus } from "@omeetso/contracts";

export async function createTicket(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { subject, category, message, priority, attachments } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      category: category || "general",
      priority: priority || SupportPriority.MEDIUM,
      status: SupportStatus.OPEN,
      lastMessageAt: new Date()
    });

    await SupportMessage.create({
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
  } catch (error) {
    next(error);
  }
}

export async function getMyTickets(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const tickets = await SupportTicket.find({ userId: req.user._id })
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
  } catch (error) {
    next(error);
  }
}

export async function getTicketMessages(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { ticketId } = req.params;
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    if (ticket.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied to ticket" } });
      return;
    }

    const messages = await SupportMessage.find({ ticketId: ticket._id })
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
  } catch (error) {
    next(error);
  }
}

export async function addTicketMessage(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { ticketId } = req.params;
    const { text, attachments } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const msg = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "user",
      senderUserId: req.user._id,
      senderName: req.user.profile.name,
      text,
      attachments: attachments || []
    });

    ticket.lastMessageAt = new Date();
    if (ticket.status === SupportStatus.RESOLVED || ticket.status === SupportStatus.CLOSED) {
      ticket.status = SupportStatus.REOPENED;
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
  } catch (error) {
    next(error);
  }
}

export async function getAdminSupportTickets(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (req.query.status) query.status = req.query.status;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate("userId", "profile.name email phone")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: tickets.map((t: any) => ({
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
  } catch (error) {
    next(error);
  }
}
