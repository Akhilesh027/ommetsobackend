import mongoose, { Schema, Document } from "mongoose";

export interface IWalletTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "CREDIT" | "DEBIT";
  amountInPaise: number;
  description: string;
  referenceType: "PROMOTION" | "AD_CAMPAIGN" | "REFUND" | "TOPUP";
  referenceId?: string;
  idempotencyKey: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amountInPaise: { type: Number, required: true },
    description: { type: String, required: true },
    referenceType: { type: String, enum: ["PROMOTION", "AD_CAMPAIGN", "REFUND", "TOPUP"], required: true },
    referenceId: { type: String },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "PENDING", index: true }
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });

export const WalletTransaction = mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
