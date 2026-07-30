import mongoose, { Schema, Document } from "mongoose";

export interface IAdAnalytics extends Document {
  campaignId: mongoose.Types.ObjectId;
  placementId: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdAnalyticsSchema = new Schema<IAdAnalytics>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "AdCampaign", required: true, index: true },
    placementId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AdAnalyticsSchema.index({ campaignId: 1, date: 1, placementId: 1 }, { unique: true });

export const AdAnalytics = mongoose.model<IAdAnalytics>("AdAnalytics", AdAnalyticsSchema);
