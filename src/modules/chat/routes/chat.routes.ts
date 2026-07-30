import { Router } from "express";
import {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  createOffer,
  updateOfferStatus,
  getOfferById
} from "../controllers/chat.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";

export const chatRouter = Router();

chatRouter.post("/conversations", authenticateUser, startConversation);
chatRouter.get("/conversations", authenticateUser, getConversations);
chatRouter.get("/conversations/:conversationId/messages", authenticateUser, getMessages);
chatRouter.post("/conversations/:conversationId/messages", authenticateUser, sendMessage);
chatRouter.post("/conversations/:conversationId/offers", authenticateUser, createOffer);
chatRouter.get("/offers/:offerId", authenticateUser, getOfferById);
chatRouter.patch("/offers/:offerId/status", authenticateUser, updateOfferStatus);
