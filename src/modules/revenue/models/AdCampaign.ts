import mongoose, { Schema, Document } from "mongoose";

export type CampaignType = "LISTING_BOOST" | "BANNER_AD";
export type PaymentStatus = "NOT_STARTED" | "PENDING" | "FUNDS_HELD" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED";
export type AdCampaignStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "SUBMITTED"
  | "PENDING_REVIEW"
  | "CHANGES_REQUIRED"
  | "APPROVED"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface IAdCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  campaignType: CampaignType;
  advertiserUserId: mongoose.Types.ObjectId;
  targetType: "LISTING" | "STORE";
  listingId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  adProductId?: mongoose.Types.ObjectId;
  placementIds: string[];
  creativeAssetId?: mongoose.Types.ObjectId;
  bannerUrl?: string;
  targeting?: {
    categoryIds?: string[];
    city?: string;
    pincodes?: string[];
  };
  pricing: {
    amountInPaise: number;
    taxInPaise: number;
    totalInPaise: number;
  };
  paymentStatus: PaymentStatus;
  status: AdCampaignStatus;
  reviewDeadlineAt?: Date;
  reviewStartedAt?: Date;
  reviewedAt?: Date;
  reviewedByAdminId?: mongoose.Types.ObjectId;
  assignedAdminId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  requestedChanges?: string[];
  requestedStartAt?: Date;
  startAt?: Date;
  endAt?: Date;
  impressionsCount: number;
  clicksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdCampaignSchema = new Schema<IAdCampaign>(
  {
    campaignType: { type: String, enum: ["LISTING_BOOST", "BANNER_AD"], required: true, index: true },
    advertiserUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["LISTING", "STORE"], default: "LISTING", index: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
    adProductId: { type: Schema.Types.ObjectId, ref: "AdProduct" },
    placementIds: [{ type: String, required: true }],
    creativeAssetId: { type: Schema.Types.ObjectId, ref: "MediaAsset" },
    bannerUrl: { type: String },
    targeting: {
      categoryIds: [{ type: String }],
      city: { type: String },
      pincodes: [{ type: String }]
    },
    pricing: {
      amountInPaise: { type: Number, required: true },
      taxInPaise: { type: Number, default: 0 },
      totalInPaise: { type: Number, required: true }
    },
    paymentStatus: {
      type: String,
      enum: ["NOT_STARTED", "PENDING", "FUNDS_HELD", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED"],
      default: "NOT_STARTED",
      index: true
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PAYMENT_PENDING",
        "SUBMITTED",
        "PENDING_REVIEW",
        "CHANGES_REQUIRED",
        "APPROVED",
        "SCHEDULED",
        "ACTIVE",
        "PAUSED",
        "REJECTED",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "DRAFT",
      index: true
    },
    reviewDeadlineAt: { type: Date, index: true },
    reviewStartedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    rejectionReason: { type: String },
    requestedChanges: [{ type: String }],
    requestedStartAt: { type: Date },
    startAt: { type: Date },
    endAt: { type: Date },
    impressionsCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AdCampaignSchema.index({ status: 1, reviewDeadlineAt: 1 });

export const AdCampaign = mongoose.model<IAdCampaign>("AdCampaign", AdCampaignSchema);
