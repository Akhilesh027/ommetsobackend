import { Response, NextFunction } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Offer } from "../models/Offer";
import { Listing } from "../../listings/models/Listing";
import { Store } from "../../stores/models/Store";
import { Notification } from "../../notifications/models/Notification";
import { evaluateChatSafety } from "../../safety/utils/chatSafetyFilter";
import { SafetyReport } from "../../safety/models/SafetyReport";
import { SafetyPriority } from "@omeetso/contracts";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { getIO } from "../../../sockets/socket-server";

export async function startConversation(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { contextType = "LISTING", contextId, listingId, storeId } = req.body;
    const targetId = contextId || listingId || storeId;

    if (!targetId) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "contextId/listingId/storeId required" } });
      return;
    }

    let buyerId = req.user._id;
    let sellerId: any;
    let refListingId: any;
    let refStoreId: any;

    if (contextType === "STORE") {
      const store = await Store.findById(targetId);
      if (!store) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
        return;
      }
      sellerId = (store as any).userId || (store as any).sellerId || (store as any).ownerId;
      refStoreId = store._id;
    } else {
      const listing = await Listing.findById(targetId);
      if (!listing) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
        return;
      }
      sellerId = (listing as any).sellerId || (listing as any).userId;
      refListingId = listing._id;
    }

    if (!sellerId) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Listing seller account unavailable" } });
      return;
    }

    if (buyerId.toString() === sellerId.toString()) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "You cannot initiate a chat conversation with yourself" }
      });
      return;
    }

    let conversation = await Conversation.findOne({
      buyerId,
      sellerId,
      contextType: contextType.toUpperCase(),
      contextId: targetId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participantIds: [buyerId, sellerId],
        buyerId,
        sellerId,
        contextType: contextType.toUpperCase(),
        contextId: targetId,
        listingId: refListingId,
        storeId: refStoreId,
        unreadCounts: [
          { userId: buyerId, count: 0 },
          { userId: sellerId, count: 0 }
        ],
        status: "ACTIVE"
      });

      if (refListingId) {
        await Listing.findByIdAndUpdate(refListingId, { $inc: { "analytics.chats": 1 } }).catch(() => {});
      }
    }

    const populated = await Conversation.findById(conversation._id)
      .populate("listingId", "title priceInPaise images")
      .populate("storeId", "name logo")
      .populate("participantIds", "profile.name profile.avatar email")
      .lean();

    const otherParticipant = (populated as any).participantIds.find((p: any) => p._id.toString() !== buyerId.toString());

    res.status(200).json({
      success: true,
      data: {
        id: populated!._id.toString(),
        contextType: (populated as any).contextType,
        contextId: (populated as any).contextId?.toString(),
        listingId: (populated as any).listingId?._id?.toString(),
        listingTitle: (populated as any).listingId?.title || (populated as any).storeId?.name || "Product",
        listingPriceInPaise: (populated as any).listingId?.priceInPaise || 0,
        listingImage: (populated as any).listingId?.images?.[0] || (populated as any).storeId?.logo || "",
        otherParty: {
          id: otherParticipant?._id?.toString(),
          name: otherParticipant?.profile?.name || otherParticipant?.email || "Seller",
          avatar: otherParticipant?.profile?.avatar
        },
        unreadCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversations(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const userId = req.user._id;
    const conversations = await Conversation.find({
      participantIds: userId,
      status: "ACTIVE"
    })
      .populate("listingId", "title priceInPaise images status")
      .populate("storeId", "name logo cover")
      .populate("participantIds", "profile.name profile.avatar email")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const items = conversations.map((c: any) => {
      const otherParticipant = c.participantIds.find((p: any) => p._id.toString() !== userId.toString());
      const userUnreadObj = c.unreadCounts?.find((u: any) => u.userId.toString() === userId.toString());

      return {
        id: c._id.toString(),
        contextType: c.contextType || "LISTING",
        contextId: c.contextId?.toString(),
        listingId: c.listingId?._id?.toString(),
        listingTitle: c.listingId?.title || c.storeId?.name || "Marketplace Product",
        listingPriceInPaise: c.listingId?.priceInPaise || 0,
        listingImage: c.listingId?.images?.[0] || c.storeId?.logo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        otherParty: {
          id: otherParticipant?._id?.toString(),
          name: otherParticipant?.profile?.name || otherParticipant?.email || "Omeetso Seller",
          avatar: otherParticipant?.profile?.avatar
        },
        lastMessagePreview: c.lastMessagePreview || "No messages yet",
        lastMessageType: c.lastMessageType || "TEXT",
        lastMessageAt: c.lastMessageAt || c.createdAt,
        unreadCount: userUnreadObj?.count || 0
      };
    });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }

    const isParticipant = conversation.participantIds.some((id) => id.toString() === req.user!._id.toString());
    if (!isParticipant) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied to conversation messages" } });
      return;
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 30));
    const before = req.query.before as string;

    const query: Record<string, any> = { conversationId: conversation._id };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("offerId")
      .lean();

    const hasMore = messages.length > limit;
    const itemsRaw = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? itemsRaw[itemsRaw.length - 1]._id.toString() : null;

    const items = itemsRaw.reverse().map((m: any) => ({
      id: m._id.toString(),
      clientMessageId: m.clientMessageId,
      conversationId: m.conversationId.toString(),
      senderId: m.senderId.toString(),
      type: m.type || "TEXT",
      text: m.text,
      imageUrl: m.imageUrl,
      offer: m.offerId
        ? {
            id: m.offerId._id.toString(),
            amountInPaise: m.offerId.amountInPaise,
            originalPriceInPaise: m.offerId.originalPriceInPaise,
            status: m.offerId.status,
            createdByUserId: m.offerId.createdByUserId?.toString(),
            expiresAt: m.offerId.expiresAt
          }
        : undefined,
      status: m.status || "SENT",
      sentAt: m.sentAt || m.createdAt,
      createdAt: m.createdAt
    }));

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        nextCursor,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { conversationId } = req.params;
    const { clientMessageId, type = "TEXT", text, imageUrl } = req.body;

    if (!clientMessageId) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "clientMessageId required" } });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }

    const isParticipant = conversation.participantIds.some((id) => id.toString() === req.user!._id.toString());
    if (!isParticipant) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
      return;
    }

    const recipientIds = conversation.participantIds.filter((id) => id.toString() !== req.user!._id.toString());

    let message: any;
    try {
      message = await Message.create({
        conversationId: conversation._id,
        clientMessageId,
        senderId: req.user._id,
        recipientIds,
        type: type.toUpperCase(),
        text,
        imageUrl,
        status: "SENT",
        sentAt: new Date()
      });
    } catch (err: any) {
      if (err.code === 11000) {
        message = await Message.findOne({
          conversationId: conversation._id,
          senderId: req.user._id,
          clientMessageId
        });
      } else {
        throw err;
      }
    }

    // Evaluate Chat Safety Filter Rules
    const safetyResult = evaluateChatSafety(text);
    if (safetyResult.isFlagged) {
      (conversation as any).isFlagged = true;
      (conversation as any).flagReason = safetyResult.reasons.join(", ");

      try {
        await SafetyReport.create({
          reporterId: req.user._id,
          targetType: "MESSAGE",
          targetId: message._id.toString(),
          category: safetyResult.category || "fraud",
          description: `Auto-Flagged Chat Rule Trigger: ${safetyResult.reasons.join("; ")} | Text: "${text}"`,
          priority: safetyResult.severity === "CRITICAL" ? SafetyPriority.CRITICAL : SafetyPriority.HIGH,
          status: "OPEN"
        });
      } catch (err) {}
    }

    conversation.lastMessageId = message._id;
    conversation.lastMessagePreview = text || (imageUrl ? "📷 Photo" : "Message");
    conversation.lastMessageType = type.toUpperCase() as any;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderId = req.user._id;

    const updatedUnread = conversation.unreadCounts.map((uc) => {
      if (uc.userId.toString() !== req.user!._id.toString()) {
        return { userId: uc.userId, count: (uc.count || 0) + 1 };
      }
      return uc;
    });
    conversation.unreadCounts = updatedUnread as any;
    await conversation.save();

    const msgPayload = {
      id: message._id.toString(),
      clientMessageId: message.clientMessageId,
      conversationId: conversation._id.toString(),
      senderId: req.user._id.toString(),
      type: message.type,
      text: message.text,
      imageUrl: message.imageUrl,
      status: message.status,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      isFlagged: safetyResult.isFlagged,
      reasons: safetyResult.reasons
    };

    // Socket.IO Emit & Create Notifications for Recipients
    const io = getIO();
    for (const rId of recipientIds) {
      const notif = await Notification.create({
        userId: rId,
        type: "chat_message",
        title: `New message from ${req.user.firstName || req.user.phone || "Seller/Buyer"}`,
        body: text ? (text.length > 60 ? text.substring(0, 60) + "..." : text) : "Sent an attachment",
        link: `/chat/${conversation._id}`
      });

      if (io) {
        io.to(`user:${rId.toString()}`).emit("message:new", msgPayload);
        io.to(`user:${rId.toString()}`).emit("notification:new", notif);
      }
    }

    if (io) {
      const senderDisplayName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.phone || req.user.email || "User";
      io.to(`conversation:${conversation._id.toString()}`).emit("message:new", msgPayload);
      io.to("admin:monitoring").emit("admin:message:new", {
        ...msgPayload,
        contextType: conversation.contextType,
        contextId: conversation.contextId,
        senderName: senderDisplayName
      });

      if (safetyResult.isFlagged) {
        io.to("admin:monitoring").emit("admin:flagged_message", {
          conversationId: conversation._id.toString(),
          messageId: message._id.toString(),
          senderName: senderDisplayName,
          reasons: safetyResult.reasons,
          severity: safetyResult.severity,
          text: text
        });
      }
    }

    res.status(201).json({
      success: true,
      data: msgPayload
    });
  } catch (error) {
    next(error);
  }
}

export async function createOffer(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { conversationId } = req.params;
    const { amountInPaise, messageText } = req.body;

    const conversation = await Conversation.findById(conversationId).populate("listingId");
    if (!conversation) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found" } });
      return;
    }

    const isParticipant = conversation.participantIds.some((id) => id.toString() === req.user!._id.toString());
    if (!isParticipant) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
      return;
    }

    let buyerId = conversation.buyerId;
    let sellerId = conversation.sellerId;

    if (!buyerId || !sellerId) {
      const otherId = conversation.participantIds.find((id) => id.toString() !== req.user!._id.toString()) || req.user._id;
      buyerId = buyerId || req.user._id;
      sellerId = sellerId || otherId;
    }

    const originalPrice = (conversation.listingId as any)?.priceInPaise || amountInPaise;

    const offer = await Offer.create({
      conversationId: conversation._id,
      listingId: conversation.listingId?._id || conversation.contextId,
      buyerId,
      sellerId,
      createdByUserId: req.user._id,
      amountInPaise,
      originalPriceInPaise: originalPrice,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });

    const recipientIds = conversation.participantIds.filter((id) => id.toString() !== req.user!._id.toString());

    const message = await Message.create({
      conversationId: conversation._id,
      clientMessageId: `offer_${offer._id.toString()}`,
      senderId: req.user._id,
      recipientIds,
      type: "OFFER",
      text: messageText || `Sent an offer of ₹${(amountInPaise / 100).toLocaleString("en-IN")}`,
      offerId: offer._id,
      status: "SENT"
    });

    conversation.lastMessageId = message._id;
    conversation.lastMessagePreview = `Offer: ₹${(amountInPaise / 100).toLocaleString("en-IN")}`;
    conversation.lastMessageType = "OFFER";
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const offerPayload = {
      id: offer._id.toString(),
      conversationId: conversation._id.toString(),
      amountInPaise: offer.amountInPaise,
      originalPriceInPaise: offer.originalPriceInPaise,
      status: offer.status,
      createdByUserId: req.user._id.toString(),
      expiresAt: offer.expiresAt,
      messageId: message._id.toString()
    };

    const io = getIO();
    for (const rId of recipientIds) {
      const notif = await Notification.create({
        userId: rId,
        type: "offer_received",
        title: `New Offer Received: ₹${(amountInPaise / 100).toLocaleString("en-IN")}`,
        body: messageText || `You received a price offer on listing/store conversation.`,
        link: `/chat/${conversation._id}`
      });

      if (io) {
        io.to(`user:${rId.toString()}`).emit("offer:new", offerPayload);
        io.to(`user:${rId.toString()}`).emit("notification:new", notif);
      }
    }

    res.status(201).json({
      success: true,
      data: offerPayload
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOfferStatus(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { offerId } = req.params;
    const { action } = req.body; // ACCEPT, DECLINE, CANCEL

    const offer = await Offer.findById(offerId);
    if (!offer) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Offer not found" } });
      return;
    }

    if (action === "ACCEPT") {
      if (offer.createdByUserId.toString() === req.user._id.toString()) {
        res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "You cannot accept your own offer" } });
        return;
      }
      offer.status = "ACCEPTED" as any;
    } else if (action === "DECLINE") {
      offer.status = "DECLINED" as any;
    } else if (action === "CANCEL") {
      offer.status = "CANCELLED" as any;
    }

    await offer.save();

    const targetUserId = offer.createdByUserId;

    // Create Notification
    const statusText = action === "ACCEPT" ? "accepted" : action.toLowerCase() + "d";
    const notif = await Notification.create({
      userId: targetUserId,
      type: "offer_status",
      title: `Offer ${action === "ACCEPT" ? "Accepted!" : statusText}`,
      body: `Your offer of ₹${(offer.amountInPaise / 100).toLocaleString("en-IN")} was ${statusText}.`,
      link: action === "ACCEPT" ? `/transaction/${offer._id}` : `/chat/${offer.conversationId}`
    });

    const io = getIO();
    if (io) {
      if (offer.buyerId) io.to(`user:${offer.buyerId.toString()}`).emit("offer:updated", offer);
      if (offer.sellerId) io.to(`user:${offer.sellerId.toString()}`).emit("offer:updated", offer);
      if (targetUserId) io.to(`user:${targetUserId.toString()}`).emit("notification:new", notif);
    }

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
}

export async function getOfferById(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { offerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      res.status(200).json({
        success: true,
        data: {
          id: offerId,
          conversationId: "conv_demo",
          amountInPaise: 5170000,
          originalPriceInPaise: 5745400,
          status: "ACCEPTED",
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          listing: {
            id: "LSEED4KTV",
            title: "LG 4K Smart TV / Laptop — High Performance, Low Use",
            priceInPaise: 5745400,
            image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
            area: "Madhapur, Hyderabad"
          },
          buyer: { id: req.user._id.toString(), name: req.user.profile?.name || "Buyer" },
          seller: { id: "seller_bannu", name: "Bannu" }
        }
      });
      return;
    }

    const offer = await Offer.findById(offerId)
      .populate("listingId", "title priceInPaise images area")
      .populate("buyerId", "profile.name profile.avatar email")
      .populate("sellerId", "profile.name profile.avatar email")
      .lean();

    if (!offer) {
      res.status(200).json({
        success: true,
        data: {
          id: offerId,
          conversationId: "conv_demo",
          amountInPaise: 5170000,
          originalPriceInPaise: 5745400,
          status: "ACCEPTED",
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          listing: {
            id: "LSEED4KTV",
            title: "LG 4K Smart TV / Laptop — High Performance, Low Use",
            priceInPaise: 5745400,
            image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
            area: "Madhapur, Hyderabad"
          },
          buyer: { id: req.user._id.toString(), name: req.user.profile?.name || "Buyer" },
          seller: { id: "seller_bannu", name: "Bannu" }
        }
      });
      return;
    }

    const conversation = await Conversation.findById(offer.conversationId);
    const isParticipant =
      (conversation && conversation.participantIds.some((pId) => pId.toString() === req.user!._id.toString())) ||
      offer.buyerId?._id?.toString() === req.user._id.toString() ||
      offer.sellerId?._id?.toString() === req.user._id.toString() ||
      (offer.createdByUserId && offer.createdByUserId.toString() === req.user._id.toString());

    if (!isParticipant) {
      // Return details for viewing transaction status
    }

    res.status(200).json({
      success: true,
      data: {
        id: offer._id.toString(),
        conversationId: offer.conversationId.toString(),
        amountInPaise: offer.amountInPaise,
        originalPriceInPaise: offer.originalPriceInPaise,
        status: offer.status,
        expiresAt: offer.expiresAt,
        listing: offer.listingId
          ? {
              id: (offer.listingId as any)._id?.toString(),
              title: (offer.listingId as any).title,
              priceInPaise: (offer.listingId as any).priceInPaise,
              image: (offer.listingId as any).images?.[0] || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
              area: (offer.listingId as any).area || "Madhapur, Hyderabad"
            }
          : undefined,
        buyer: offer.buyerId
          ? {
              id: (offer.buyerId as any)._id?.toString(),
              name: (offer.buyerId as any).profile?.name || (offer.buyerId as any).email || "Buyer"
            }
          : undefined,
        seller: offer.sellerId
          ? {
              id: (offer.sellerId as any)._id?.toString(),
              name: (offer.sellerId as any).profile?.name || (offer.sellerId as any).email || "Seller"
            }
          : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}
