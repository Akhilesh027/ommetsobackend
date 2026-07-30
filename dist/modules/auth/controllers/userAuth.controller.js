"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
exports.refreshUserSession = refreshUserSession;
exports.logoutUser = logoutUser;
exports.getUserSession = getUserSession;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../../users/models/User");
const OtpChallenge_1 = require("../models/OtpChallenge");
const UserSession_1 = require("../models/UserSession");
const token_1 = require("../utils/token");
const env_1 = require("../../../config/env");
const USER_REFRESH_COOKIE = "omeetso_user_refresh";
async function requestOtp(req, res, next) {
    try {
        const { phone } = req.body;
        const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
        // Rate limiting resend count
        const recentChallenge = await OtpChallenge_1.OtpChallenge.findOne({
            phone: normalizedPhone,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });
        if (recentChallenge) {
            res.status(429).json({
                success: false,
                error: { code: "TOO_MANY_REQUESTS", message: "Please wait 60 seconds before requesting another OTP." }
            });
            return;
        }
        // Generate 4-digit code (simulated SMS client or random code in development)
        // In production, an SMS service (MSG91/Twilio) dispatches this code to phone.
        const rawCode = env_1.env.NODE_ENV === "development" ? "1234" : Math.floor(1000 + Math.random() * 9000).toString();
        const codeHash = crypto_1.default.createHash("sha256").update(rawCode).digest("hex");
        await OtpChallenge_1.OtpChallenge.create({
            phone: normalizedPhone,
            codeHash,
            attempts: 0,
            resendCount: 0,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });
        console.log(`[SMS Client] OTP sent to ${normalizedPhone}: ${rawCode}`);
        res.status(200).json({
            success: true,
            data: {
                message: "OTP sent successfully to your mobile number",
                expiresInSeconds: 600
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function verifyOtp(req, res, next) {
    try {
        const { phone, code } = req.body;
        const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
        const codeHash = crypto_1.default.createHash("sha256").update(code).digest("hex");
        const challenge = await OtpChallenge_1.OtpChallenge.findOne({
            phone: normalizedPhone,
            expiresAt: { $gt: new Date() },
            isVerified: false
        }).sort({ createdAt: -1 });
        if (!challenge) {
            res.status(400).json({
                success: false,
                error: { code: "OTP_EXPIRED", message: "OTP has expired or is invalid. Please request a new code." }
            });
            return;
        }
        if (challenge.attempts >= 5) {
            res.status(429).json({
                success: false,
                error: { code: "TOO_MANY_ATTEMPTS", message: "Maximum OTP verification attempts reached. Request a new OTP." }
            });
            return;
        }
        if (challenge.codeHash !== codeHash) {
            challenge.attempts += 1;
            await challenge.save();
            res.status(400).json({
                success: false,
                error: { code: "INVALID_OTP", message: "Invalid 4-digit OTP code." }
            });
            return;
        }
        challenge.isVerified = true;
        await challenge.save();
        // Find or create user on first login
        let user = await User_1.User.findOne({ phone: normalizedPhone });
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await User_1.User.create({
                phone: normalizedPhone,
                accountType: "individual",
                profile: {
                    name: `User ${normalizedPhone.slice(-4)}`,
                    city: "Hyderabad",
                    pincode: "500081",
                    area: "Madhapur",
                    language: "en",
                    memberSince: new Date()
                },
                verificationSummary: {
                    mobileVerified: true,
                    emailVerified: false,
                    identityVerified: false,
                    businessVerified: false
                }
            });
        }
        // Issue JWT Access Token & Refresh Session Cookie
        const accessToken = (0, token_1.generateUserAccessToken)(user._id.toString());
        const rawRefreshToken = (0, token_1.generateOpaqueToken)();
        const refreshTokenHash = (0, token_1.hashToken)(rawRefreshToken);
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await UserSession_1.UserSession.create({
            userId: user._id,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: refreshExpiresAt
        });
        res.cookie(USER_REFRESH_COOKIE, rawRefreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/v1/auth",
            expires: refreshExpiresAt
        });
        res.status(200).json({
            success: true,
            data: {
                accessToken,
                isNewUser,
                user: {
                    id: user._id.toString(),
                    phone: user.phone,
                    email: user.email,
                    accountType: user.accountType,
                    status: user.status,
                    profile: user.profile,
                    verificationSummary: user.verificationSummary
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function refreshUserSession(req, res, next) {
    try {
        const rawRefreshToken = req.cookies[USER_REFRESH_COOKIE];
        if (!rawRefreshToken) {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "No refresh session cookie found" }
            });
            return;
        }
        const tokenHash = (0, token_1.hashToken)(rawRefreshToken);
        const session = await UserSession_1.UserSession.findOne({
            refreshTokenHash: tokenHash,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });
        if (!session) {
            res.clearCookie(USER_REFRESH_COOKIE, { path: "/api/v1/auth" });
            res.status(401).json({
                success: false,
                error: { code: "SESSION_EXPIRED", message: "Session expired or revoked. Please sign in again." }
            });
            return;
        }
        const user = await User_1.User.findById(session.userId);
        if (!user || user.status === "DELETED" || user.status === "PERMANENTLY_SUSPENDED") {
            res.clearCookie(USER_REFRESH_COOKIE, { path: "/api/v1/auth" });
            res.status(403).json({
                success: false,
                error: { code: "ACCOUNT_SUSPENDED", message: "Account unavailable" }
            });
            return;
        }
        // Token Rotation: revoke old session, create new
        session.isRevoked = true;
        await session.save();
        const newRawRefreshToken = (0, token_1.generateOpaqueToken)();
        const newRefreshTokenHash = (0, token_1.hashToken)(newRawRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await UserSession_1.UserSession.create({
            userId: user._id,
            refreshTokenHash: newRefreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: newExpiresAt
        });
        const newAccessToken = (0, token_1.generateUserAccessToken)(user._id.toString());
        res.cookie(USER_REFRESH_COOKIE, newRawRefreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/v1/auth",
            expires: newExpiresAt
        });
        res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
                user: {
                    id: user._id.toString(),
                    phone: user.phone,
                    email: user.email,
                    accountType: user.accountType,
                    status: user.status,
                    profile: user.profile,
                    verificationSummary: user.verificationSummary
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function logoutUser(req, res, next) {
    try {
        const rawRefreshToken = req.cookies[USER_REFRESH_COOKIE];
        if (rawRefreshToken) {
            const tokenHash = (0, token_1.hashToken)(rawRefreshToken);
            await UserSession_1.UserSession.updateOne({ refreshTokenHash: tokenHash }, { $set: { isRevoked: true } });
        }
        res.clearCookie(USER_REFRESH_COOKIE, { path: "/api/v1/auth" });
        res.status(200).json({
            success: true,
            data: { message: "Logged out successfully" }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getUserSession(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            return;
        }
        const u = req.user;
        res.status(200).json({
            success: true,
            data: {
                id: u._id.toString(),
                phone: u.phone,
                email: u.email,
                accountType: u.accountType,
                status: u.status,
                profile: u.profile,
                verificationSummary: u.verificationSummary
            }
        });
    }
    catch (error) {
        next(error);
    }
}
