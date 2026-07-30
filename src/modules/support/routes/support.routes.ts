import { Router } from "express";
import {
  createTicket,
  getMyTickets,
  getTicketMessages,
  addTicketMessage,
  getAdminSupportTickets
} from "../controllers/support.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const supportRouter = Router();

supportRouter.post("/tickets", authenticateUser, createTicket);
supportRouter.get("/tickets", authenticateUser, getMyTickets);
supportRouter.get("/tickets/:ticketId/messages", authenticateUser, getTicketMessages);
supportRouter.post("/tickets/:ticketId/messages", authenticateUser, addTicketMessage);

supportRouter.get("/admin/tickets", authenticateAdmin, requirePermission("support.view"), getAdminSupportTickets);
