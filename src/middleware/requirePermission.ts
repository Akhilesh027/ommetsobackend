import { Response, NextFunction } from "express";
import { AuthenticatedAdminRequest } from "./authenticateAdmin";

export function requirePermission(permission: string) {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Admin authentication required" }
      });
      return;
    }

    const hasPermission =
      req.admin.role === "Super Admin" ||
      req.admin.permissions.includes("*") ||
      req.admin.permissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Insufficient permissions. Required: "${permission}"`
        }
      });
      return;
    }

    next();
  };
}
