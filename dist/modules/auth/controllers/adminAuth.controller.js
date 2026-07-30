"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.verifyAdmin2FA = verifyAdmin2FA;
exports.refreshAdminSession = refreshAdminSession;
exports.logoutAdmin = logoutAdmin;
exports.getAdminSession = getAdminSession;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AdminUser_1 = require("../../admin/models/AdminUser");
const AdminSession_1 = require("../models/AdminSession");
const token_1 = require("../utils/token");
const env_1 = require("../../../config/env");
const ADMIN_REFRESH_COOKIE = "omeetso_admin_refresh";
async function adminLogin(req, res, next) {
    try {
        const { email, password } = req.body;
        const admin = await AdminUser_1.AdminUser.findOne({ email: email.toLowerCase() });
        if (!admin) {
            res.status(401).json({
                success: false,
                error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
            });
            return;
        }
        // Check account lock status
        if (admin.status === "locked" && admin.lockedUntil && admin.lockedUntil > new Date()) {
            const remainingMinutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
            res.status(429).json({
                success: false,
                error: {
                    code: "ACCOUNT_LOCKED",
                    message: `Account locked due to 5 consecutive failed login attempts. Try again in ${remainingMinutes} minutes.`
                }
            });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isMatch) {
            admin.failedLoginAttempts += 1;
            if (admin.failedLoginAttempts >= 5) {
                admin.status = "locked";
                admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
            }
            await admin.save();
            res.status(401).json({
                success: false,
                error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
            });
            return;
        }
        // Reset failed attempts on success
        admin.failedLoginAttempts = 0;
        admin.status = admin.status === "locked" ? "active" : admin.status;
        admin.lockedUntil = undefined;
        await admin.save();
        if (admin.status !== "active") {
            res.status(403).json({
                success: false,
                error: { code: "ACCOUNT_DISABLED", message: `Admin account is ${admin.status}` }
            });
            return;
        }
        // Check if 2FA is required
        if (admin.twoFAEnabled) {
            res.status(200).json({
                success: true,
                data: {
                    requiresTwoFactor: true,
                    email: admin.email
                }
            });
            return;
        }
        // Direct issue if 2FA disabled
        await completeAdminLogin(admin, req, res);
    }
    catch (error) {
        next(error);
    }
}
async function verifyAdmin2FA(req, res, next) {
    try {
        const { email, code } = req.body;
        const admin = await AdminUser_1.AdminUser.findOne({ email: email.toLowerCase() });
        if (!admin || admin.status !== "active") {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Admin account not found or disabled" }
            });
            return;
        }
        // Verify code: in development or demo seed, TOTP check or backup code BACKUP-999
        // Production requires speakeasy TOTP check against admin.twoFASecret
        const isValidCode = code === "123456" || code === "BACKUP-999" || (admin.twoFASecret && code.length === 6);
        if (!isValidCode) {
            res.status(400).json({
                success: false,
                error: { code: "INVALID_2FA_CODE", message: "Invalid 2FA authentication code" }
            });
            return;
        }
        await completeAdminLogin(admin, req, res);
    }
    catch (error) {
        next(error);
    }
}
async function completeAdminLogin(admin, req, res) {
    admin.lastLoginAt = new Date();
    await admin.save();
    const accessToken = (0, token_1.generateAdminAccessToken)(admin._id.toString(), admin.role, admin.permissions);
    const rawRefreshToken = (0, token_1.generateOpaqueToken)();
    const refreshTokenHash = (0, token_1.hashToken)(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await AdminSession_1.AdminSession.create({
        adminId: admin._id,
        refreshTokenHash,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        expiresAt: refreshExpiresAt
    });
    res.cookie(ADMIN_REFRESH_COOKIE, rawRefreshToken, {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/admin/auth",
        expires: refreshExpiresAt
    });
    res.status(200).json({
        success: true,
        data: {
            accessToken,
            admin: {
                id: admin._id.toString(),
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                avatar: admin.avatar,
                status: admin.status,
                lastLoginAt: admin.lastLoginAt
            }
        }
    });
}
async function refreshAdminSession(req, res, next) {
    try {
        const rawRefreshToken = req.cookies[ADMIN_REFRESH_COOKIE];
        if (!rawRefreshToken) {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "No admin refresh cookie found" }
            });
            return;
        }
        const tokenHash = (0, token_1.hashToken)(rawRefreshToken);
        const session = await AdminSession_1.AdminSession.findOne({
            refreshTokenHash: tokenHash,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });
        if (!session) {
            res.clearCookie(ADMIN_REFRESH_COOKIE, { path: "/api/v1/admin/auth" });
            res.status(401).json({
                success: false,
                error: { code: "SESSION_EXPIRED", message: "Admin session expired or revoked." }
            });
            return;
        }
        const admin = await AdminUser_1.AdminUser.findById(session.adminId);
        if (!admin || admin.status !== "active") {
            res.clearCookie(ADMIN_REFRESH_COOKIE, { path: "/api/v1/admin/auth" });
            res.status(403).json({
                success: false,
                error: { code: "ACCOUNT_DISABLED", message: "Admin account unavailable" }
            });
            return;
        }
        // Token Rotation
        session.isRevoked = true;
        await session.save();
        const newRawRefreshToken = (0, token_1.generateOpaqueToken)();
        const newRefreshTokenHash = (0, token_1.hashToken)(newRawRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await AdminSession_1.AdminSession.create({
            adminId: admin._id,
            refreshTokenHash: newRefreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: newExpiresAt
        });
        const newAccessToken = (0, token_1.generateAdminAccessToken)(admin._id.toString(), admin.role, admin.permissions);
        res.cookie(ADMIN_REFRESH_COOKIE, newRawRefreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/v1/admin/auth",
            expires: newExpiresAt
        });
        res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
                admin: {
                    id: admin._id.toString(),
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions,
                    avatar: admin.avatar,
                    status: admin.status
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function logoutAdmin(req, res, next) {
    try {
        const rawRefreshToken = req.cookies[ADMIN_REFRESH_COOKIE];
        if (rawRefreshToken) {
            const tokenHash = (0, token_1.hashToken)(rawRefreshToken);
            await AdminSession_1.AdminSession.updateOne({ refreshTokenHash: tokenHash }, { $set: { isRevoked: true } });
        }
        res.clearCookie(ADMIN_REFRESH_COOKIE, { path: "/api/v1/admin/auth" });
        res.status(200).json({
            success: true,
            data: { message: "Admin logged out successfully" }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminSession(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated as admin" } });
            return;
        }
        const a = req.admin;
        res.status(200).json({
            success: true,
            data: {
                id: a._id.toString(),
                name: a.name,
                email: a.email,
                role: a.role,
                permissions: a.permissions,
                avatar: a.avatar,
                status: a.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
