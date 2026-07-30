import { Router } from "express";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notifications.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticateUser, getNotifications);
notificationsRouter.patch("/read-all", authenticateUser, markAllNotificationsRead);
notificationsRouter.patch("/:notificationId/read", authenticateUser, markNotificationRead);
