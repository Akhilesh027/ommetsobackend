"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.admin) {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Admin authentication required" }
            });
            return;
        }
        const hasPermission = req.admin.role === "Super Admin" ||
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
