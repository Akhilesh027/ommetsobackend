import mongoose, { Schema, Document } from "mongoose";

export interface IMediaAsset extends Document {
  _id: mongoose.Types.ObjectId;
  ownerUserId: mongoose.Types.ObjectId;
  uploadedByAdminId?: mongoose.Types.ObjectId;
  purpose: "listing_photo" | "store_logo" | "store_cover" | "chat_attachment" | "kyc_document";
  storageKey: string;
  secureUrl: string;
  isPrivate: boolean;
  status: "unattached" | "attached" | "deleted";
  linkedEntityType?: "Listing" | "Store" | "Message" | "VerificationRequest";
  linkedEntityId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    uploadedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    purpose: {
      type: String,
      enum: ["listing_photo", "store_logo", "store_cover", "chat_attachment", "kyc_document"],
      required: true
    },
    storageKey: { type: String, required: true, unique: true },
    secureUrl: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    status: { type: String, enum: ["unattached", "attached", "deleted"], default: "unattached", index: true },
    linkedEntityType: { type: String, enum: ["Listing", "Store", "Message", "VerificationRequest"] },
    linkedEntityId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

MediaAssetSchema.index({ status: 1, createdAt: 1 });

export const MediaAsset = mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
