"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = authenticateAdmin;
const token_1 = require("../modules/auth/utils/token");
const AdminUser_1 = require("../modules/admin/models/AdminUser");
async function authenticateAdmin(req, res, next) {
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
        const payload = (0, token_1.verifyAccessToken)(token);
        if (payload.aud !== "omeetso-admin") {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Token audience invalid for admin endpoints" }
            });
            return;
        }
        const admin = await AdminUser_1.AdminUser.findById(payload.adminId);
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
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: { code: "TOKEN_EXPIRED", message: "Admin access token expired or invalid" }
        });
    }
}
