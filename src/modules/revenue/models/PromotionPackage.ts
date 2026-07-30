import mongoose, { Schema, Document } from "mongoose";

export interface IPromotionPackage extends Document {
  _id: mongoose.Types.ObjectId;
  packageId: string;
  name: string;
  durationDays: number;
  priceInPaise: number;
  badgeType: "FEATURED" | "BOOST" | "HIGHLIGHT";
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionPackageSchema = new Schema<IPromotionPackage>(
  {
    packageId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    durationDays: { type: Number, required: true },
    priceInPaise: { type: Number, required: true },
    badgeType: { type: String, enum: ["FEATURED", "BOOST", "HIGHLIGHT"], required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const PromotionPackage = mongoose.model<IPromotionPackage>("PromotionPackage", PromotionPackageSchema);
