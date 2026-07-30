import { Router } from "express";
import {
  submitVerification,
  getMyVerifications,
  getAdminVerifications,
  approveVerification
} from "../controllers/verification.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const verificationRouter = Router();

verificationRouter.post("/", authenticateUser, submitVerification);
verificationRouter.get("/me", authenticateUser, getMyVerifications);

verificationRouter.get("/admin", authenticateAdmin, requirePermission("users.view"), getAdminVerifications);
verificationRouter.patch("/admin/:requestId/approve", authenticateAdmin, requirePermission("users.edit"), approveVerification);
