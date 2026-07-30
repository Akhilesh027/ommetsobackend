import mongoose, { Schema, Document } from "mongoose";

export interface IAdminUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  permissions: string[];
  avatar?: string;
  status: "active" | "suspended" | "locked";
  twoFASecret?: string;
  twoFAEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: "Super Admin" },
    permissions: [{ type: String }],
    avatar: { type: String },
    status: { type: String, enum: ["active", "suspended", "locked"], default: "active", index: true },
    twoFASecret: { type: String },
    twoFAEnabled: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const AdminUser = mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
