import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AdminTokenPayload } from "../modules/auth/utils/token";
import { AdminUser, IAdminUser } from "../modules/admin/models/AdminUser";

export interface AuthenticatedAdminRequest extends Request {
  admin?: IAdminUser;
}

export async function authenticateAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Admin access token missing or invalid" }
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken<AdminTokenPayload>(token);

    if (payload.aud !== "omeetso-admin") {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Token audience invalid for admin endpoints" }
      });
      return;
    }

    const admin = await AdminUser.findById(payload.adminId);
    if (!admin) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Admin account no longer exists" }
      });
      return;
    }

    if (admin.status !== "active") {
      res.status(403).json({
        success: false,
        error: { code: "ACCOUNT_DISABLED", message: `Admin account is ${admin.status}` }
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Admin access token expired or invalid" }
    });
  }
}
