import mongoose, { Schema, Document } from "mongoose";

export interface IUserSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// TTL index to automatically purge expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSession = mongoose.model<IUserSession>("UserSession", UserSessionSchema);
