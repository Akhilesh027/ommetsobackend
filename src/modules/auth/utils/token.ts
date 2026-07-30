import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../../config/env";

export interface UserTokenPayload {
  userId: string;
  aud: "omeetso-user";
}

export interface AdminTokenPayload {
  adminId: string;
  role: string;
  permissions: string[];
  aud: "omeetso-admin";
}

export function generateUserAccessToken(userId: string): string {
  const payload: UserTokenPayload = {
    userId,
    aud: "omeetso-user"
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function generateAdminAccessToken(adminId: string, role: string, permissions: string[]): string {
  const payload: AdminTokenPayload = {
    adminId,
    role,
    permissions,
    aud: "omeetso-admin"
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken<T = UserTokenPayload | AdminTokenPayload>(token: string): T {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as T;
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
