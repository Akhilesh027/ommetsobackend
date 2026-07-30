import mongoose, { Schema, Document } from "mongoose";

export interface IOtpChallenge extends Document {
  _id: mongoose.Types.ObjectId;
  phone: string;
  codeHash: string;
  attempts: number;
  resendCount: number;
  expiresAt: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpChallengeSchema.index({ phone: 1, createdAt: -1 });

export const OtpChallenge = mongoose.model<IOtpChallenge>("OtpChallenge", OtpChallengeSchema);
