import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSession extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSession>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminSession = mongoose.model<IAdminSession>("AdminSession", AdminSessionSchema);
