import mongoose, { Schema, Document } from "mongoose";

export interface IWalletHold extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  amountInPaise: number;
  status: "HELD" | "CAPTURED" | "RELEASED";
  expiresAt?: Date;
  capturedAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletHoldSchema = new Schema<IWalletHold>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "AdCampaign", required: true, index: true },
    amountInPaise: { type: Number, required: true },
    status: { type: String, enum: ["HELD", "CAPTURED", "RELEASED"], default: "HELD", index: true },
    expiresAt: { type: Date },
    capturedAt: { type: Date },
    releasedAt: { type: Date }
  },
  { timestamps: true }
);

export const WalletHold = mongoose.model<IWalletHold>("WalletHold", WalletHoldSchema);
