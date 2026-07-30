import { Router } from "express";
import {
  adminLogin,
  verifyAdmin2FA,
  refreshAdminSession,
  logoutAdmin,
  getAdminSession
} from "../controllers/adminAuth.controller";
import { validateBody } from "../../../middleware/validateRequest";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { AdminLoginSchema, AdminTwoFactorSchema } from "../../../contracts";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", validateBody(AdminLoginSchema), adminLogin);
adminAuthRouter.post("/two-factor/verify", validateBody(AdminTwoFactorSchema), verifyAdmin2FA);
adminAuthRouter.post("/refresh", refreshAdminSession);
adminAuthRouter.post("/logout", logoutAdmin);
adminAuthRouter.get("/session", authenticateAdmin, getAdminSession);
