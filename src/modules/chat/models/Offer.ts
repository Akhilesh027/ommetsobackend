import mongoose, { Schema, Document } from "mongoose";
import { OfferStatus } from "../../../contracts";

export interface IOffer extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  createdByUserId: mongoose.Types.ObjectId;
  amountInPaise: number;
  originalPriceInPaise?: number;
  counterAmountInPaise?: number;
  message?: string;
  counterMessage?: string;
  status: OfferStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountInPaise: { type: Number, required: true },
    originalPriceInPaise: { type: Number },
    counterAmountInPaise: { type: Number },
    message: { type: String },
    counterMessage: { type: String },
    status: { type: String, enum: Object.values(OfferStatus), default: OfferStatus.PENDING, index: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date }
  },
  { timestamps: true }
);

export const Offer = mongoose.model<IOffer>("Offer", OfferSchema);
