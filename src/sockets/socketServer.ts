import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken, UserTokenPayload } from "../modules/auth/utils/token";
import { Conversation } from "../modules/chat/models/Conversation";
import { Message } from "../modules/chat/models/Message";

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
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
      const payload = verifyAccessToken<UserTokenPayload>(token);
      if (payload.aud !== "omeetso-user") {
        return next(new Error("Token audience invalid for socket connection"));
      }
      (socket as any).userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Invalid or expired socket access token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket] User connected: ${userId} (${socket.id})`);

    // Auto-join user room
    socket.join(`user:${userId}`);

    // Join Conversation Room with Strict Membership Verification
    socket.on("conversation:join", async ({ conversationId }: { conversationId: string }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
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
      } catch (err) {
        socket.emit("error", { code: "INTERNAL_ERROR", message: "Failed to join room" });
      }
    });

    socket.on("conversation:leave", ({ conversationId }: { conversationId: string }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing Indicators
    socket.on("typing:start", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId });
    });

    // Real-Time Idempotent Message Sending
    socket.on(
      "message:send",
      async (data: { conversationId: string; clientMessageId?: string; text?: string; kind?: string }) => {
        try {
          const { conversationId, clientMessageId, text, kind } = data;
          const conversation = await Conversation.findById(conversationId);

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
            const existing = await Message.findOne({ senderId: userId, clientMessageId });
            if (existing) {
              socket.emit("message:ack", { clientMessageId, messageId: existing._id.toString(), status: "sent" });
              return;
            }
          }

          const recipientIds = conversation.participantIds.filter((id) => id.toString() !== userId);

          // Save to MongoDB first before emission
          const message = await Message.create({
            conversationId: conversation._id,
            senderId: userId,
            recipientIds,
            clientMessageId,
            type: "TEXT",
            text,
            status: "SENT"
          });

          // Update conversation metadata
          conversation.lastMessagePreview = text || "Sent an attachment";
          conversation.lastMessageAt = new Date();
          conversation.lastSenderId = new mongoose.Types.ObjectId(userId);
          await conversation.save();

          const messageDto = {
            id: message._id.toString(),
            conversationId: conversationId,
            senderId: userId,
            clientMessageId,
            type: message.type,
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
        } catch (err) {
          socket.emit("message:error", { clientMessageId: data.clientMessageId, message: "Failed to send message" });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  return io;
}
