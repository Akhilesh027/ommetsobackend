import { Router } from "express";
import { getDashboardSummary, getLiveActivity, getAuditLogs } from "../controllers/adminDashboard.controller";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const adminDashboardRouter = Router();

adminDashboardRouter.get("/summary", authenticateAdmin, requirePermission("dashboard.view"), getDashboardSummary);
adminDashboardRouter.get("/live-activity", authenticateAdmin, requirePermission("dashboard.view"), getLiveActivity);
adminDashboardRouter.get("/audit-logs", authenticateAdmin, requirePermission("audit.view"), getAuditLogs);
