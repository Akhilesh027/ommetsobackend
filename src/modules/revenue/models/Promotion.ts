import mongoose, { Schema, Document } from "mongoose";

export interface IPromotion extends Document {
  _id: mongoose.Types.ObjectId;
  ownerUserId: mongoose.Types.ObjectId;
  targetType: "Listing" | "Store";
  targetId: mongoose.Types.ObjectId;
  packageId: string;
  amountInPaise: number;
  status: "SUBMITTED" | "ACTIVE" | "EXPIRED" | "REJECTED";
  startAt?: Date;
  endAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["Listing", "Store"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    packageId: { type: String, required: true },
    amountInPaise: { type: Number, required: true },
    status: { type: String, enum: ["SUBMITTED", "ACTIVE", "EXPIRED", "REJECTED"], default: "SUBMITTED", index: true },
    startAt: { type: Date },
    endAt: { type: Date }
  },
  { timestamps: true }
);

PromotionSchema.index({ status: 1, endAt: 1 });

export const Promotion = mongoose.model<IPromotion>("Promotion", PromotionSchema);
