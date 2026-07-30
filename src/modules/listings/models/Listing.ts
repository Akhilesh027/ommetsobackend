import mongoose, { Schema, Document } from "mongoose";
import { ListingStatus } from "@omeetso/contracts";

export interface IListingRejection {
  reason: string;
  section?: string;
  correction?: string;
  date: Date;
}

export interface IListingAnalytics {
  views: number;
  saves: number;
  chats: number;
}

export interface IAIAudit {
  passed: boolean;
  resolution: string;
  noPhoneText: boolean;
  watermarkPassed: boolean;
}

export interface IListing extends Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  priceInPaise: number;
  negotiable: boolean;
  free: boolean;
  condition: string;
  images: string[];
  coverIndex: number;
  videoUrl?: string;
  pincode: string;
  area: string;
  city: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  fulfilment: string;
  specs: Map<string, string>;
  contactPref: string;
  status: ListingStatus;
  publishedAt?: Date;
  expiresAt?: Date;
  rejection?: IListingRejection;
  analytics: IListingAnalytics;
  aiAudit?: IAIAudit;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
    categoryId: { type: String, required: true, index: true },
    subcategoryId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priceInPaise: { type: Number, required: true, index: true },
    negotiable: { type: Boolean, default: true },
    free: { type: Boolean, default: false },
    condition: { type: String, required: true },
    images: [{ type: String, required: true }],
    coverIndex: { type: Number, default: 0 },
    videoUrl: { type: String },
    pincode: { type: String, required: true, index: true },
    area: { type: String, required: true },
    city: { type: String, required: true, default: "Hyderabad", index: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [78.3871, 17.4486] }
    },
    fulfilment: { type: String, required: true, default: "pickup" },
    specs: { type: Map, of: String, default: {} },
    contactPref: { type: String, default: "call_and_chat" },
    status: { type: String, enum: Object.values(ListingStatus), default: ListingStatus.SUBMITTED, index: true },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    rejection: {
      reason: { type: String },
      section: { type: String },
      correction: { type: String },
      date: { type: Date }
    },
    analytics: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      chats: { type: Number, default: 0 }
    },
    aiAudit: {
      passed: { type: Boolean, default: true },
      resolution: { type: String, default: "1920x1080 (HD)" },
      noPhoneText: { type: Boolean, default: true },
      watermarkPassed: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

// Indexes
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
ListingSchema.index({ status: 1, categoryId: 1, priceInPaise: 1 });
ListingSchema.index({ sellerId: 1, status: 1 });
ListingSchema.index({ location: "2dsphere" });
ListingSchema.index({ title: "text", description: "text" });

export const Listing = mongoose.model<IListing>("Listing", ListingSchema);
