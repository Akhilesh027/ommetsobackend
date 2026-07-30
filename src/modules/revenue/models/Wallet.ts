import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balanceInPaise: number;
  refundBalanceInPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    balanceInPaise: { type: Number, default: 0 },
    refundBalanceInPaise: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
