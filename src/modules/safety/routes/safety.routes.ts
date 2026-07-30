import { Router } from "express";
import { createSafetyReport, getAdminSafetyReports, resolveSafetyReport } from "../controllers/safety.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const safetyRouter = Router();

safetyRouter.post("/", authenticateUser, createSafetyReport);
safetyRouter.get("/admin", authenticateAdmin, requirePermission("safety.view"), getAdminSafetyReports);
safetyRouter.patch("/admin/:reportId/resolve", authenticateAdmin, requirePermission("safety.investigate"), resolveSafetyReport);
