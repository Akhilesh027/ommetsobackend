import mongoose, { Schema, Document } from "mongoose";

export interface IAdPlacement extends Document {
  _id: mongoose.Types.ObjectId;
  placementId: string; // e.g. "HOMEPAGE_HERO", "CATEGORY_HEADER", "SEARCH_TOP", "HOMEPAGE_CAROUSEL"
  name: string;
  campaignTypes: ("LISTING_BOOST" | "BANNER_AD")[];
  aspectRatio: string; // e.g. "16:9", "3:1", "CARD"
  minimumWidth: number;
  minimumHeight: number;
  maximumFileSizeBytes: number;
  maximumActiveSlots: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdPlacementSchema = new Schema<IAdPlacement>(
  {
    placementId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    campaignTypes: [{ type: String, enum: ["LISTING_BOOST", "BANNER_AD"], required: true }],
    aspectRatio: { type: String, required: true },
    minimumWidth: { type: Number, required: true },
    minimumHeight: { type: Number, required: true },
    maximumFileSizeBytes: { type: Number, required: true, default: 2097152 },
    maximumActiveSlots: { type: Number, required: true, default: 5 },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const AdPlacement = mongoose.model<IAdPlacement>("AdPlacement", AdPlacementSchema);
