import mongoose, { Schema, Document } from "mongoose";

export interface IMediaAsset extends Document {
  _id: mongoose.Types.ObjectId;
  ownerUserId: mongoose.Types.ObjectId;
  purpose: "AD_CREATIVE" | "LISTING_IMAGE" | "STORE_LOGO";
  storageKey: string;
  secureUrl: string;
  width: number;
  height: number;
  mimeType: string;
  sizeInBytes: number;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, enum: ["AD_CREATIVE", "LISTING_IMAGE", "STORE_LOGO"], default: "AD_CREATIVE", index: true },
    storageKey: { type: String, required: true },
    secureUrl: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    mimeType: { type: String, required: true },
    sizeInBytes: { type: Number, required: true },
    moderationStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "APPROVED", index: true }
  },
  { timestamps: true }
);

export const MediaAsset = mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
