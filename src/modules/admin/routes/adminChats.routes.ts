import { Router } from "express";
import {
  getAdminConversations,
  getAdminConversationMessages,
  flagAdminConversation,
  sendAdminWarningMessage
} from "../controllers/adminChats.controller";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const adminChatsRouter = Router();

adminChatsRouter.get("/conversations", authenticateAdmin, requirePermission("communication.view"), getAdminConversations);
adminChatsRouter.get("/conversations/:conversationId/messages", authenticateAdmin, requirePermission("communication.view"), getAdminConversationMessages);
adminChatsRouter.patch("/conversations/:conversationId/flag", authenticateAdmin, requirePermission("communication.view"), flagAdminConversation);
adminChatsRouter.post("/conversations/:conversationId/warning", authenticateAdmin, requirePermission("communication.view"), sendAdminWarningMessage);
