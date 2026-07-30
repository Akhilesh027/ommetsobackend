"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserAccessToken = generateUserAccessToken;
exports.generateAdminAccessToken = generateAdminAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateOpaqueToken = generateOpaqueToken;
exports.hashToken = hashToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../../config/env");
function generateUserAccessToken(userId) {
    const payload = {
        userId,
        aud: "omeetso-user"
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN
    });
}
function generateAdminAccessToken(adminId, role, permissions) {
    const payload = {
        adminId,
        role,
        permissions,
        aud: "omeetso-admin"
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
function generateOpaqueToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
