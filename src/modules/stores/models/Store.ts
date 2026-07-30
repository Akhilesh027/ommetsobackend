import mongoose, { Schema, Document } from "mongoose";
import { StoreStatus } from "@omeetso/contracts";

export interface IWorkingHour {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  closed: boolean;
  open: string;  // "10:00"
  close: string; // "21:00"
}

export interface IStoreDelivery {
  pickup: boolean;
  localDelivery: boolean;
  buyerPickup: boolean;
  radiusKm: number;
  chargeInPaise: number;
  freeAboveInPaise: number;
}

export interface IStore extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  businessType: string;
  logo?: string;
  cover?: string;
  primaryCategory: string;
  supportingCategories: string[];
  pincode: string;
  area: string;
  city: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  businessMobile: string;
  email: string;
  website?: string;
  gstin?: string;
  workingHours: IWorkingHour[];
  is24x7: boolean;
  delivery: IStoreDelivery;
  status: StoreStatus;
  rating: number;
  reviewCount: number;
  followersCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    tagline: { type: String },
    description: { type: String, required: true },
    businessType: { type: String, required: true, default: "Retailer" },
    logo: { type: String },
    cover: { type: String },
    primaryCategory: { type: String, required: true, index: true },
    supportingCategories: [{ type: String }],
    pincode: { type: String, required: true, index: true },
    area: { type: String, required: true },
    city: { type: String, required: true, default: "Hyderabad", index: true },
    address: { type: String, required: true },
    gstin: { type: String, default: "36AABCU9603R1ZM" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [78.3871, 17.4486] }
    },
    businessMobile: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    workingHours: [
      {
        day: { type: String, required: true },
        closed: { type: Boolean, default: false },
        open: { type: String, default: "10:00" },
        close: { type: String, default: "21:00" }
      }
    ],
    is24x7: { type: Boolean, default: false },
    delivery: {
      pickup: { type: Boolean, default: true },
      localDelivery: { type: Boolean, default: true },
      buyerPickup: { type: Boolean, default: true },
      radiusKm: { type: Number, default: 10 },
      chargeInPaise: { type: Number, default: 5000 },
      freeAboveInPaise: { type: Number, default: 50000 }
    },
    status: { type: String, enum: Object.values(StoreStatus), default: StoreStatus.SUBMITTED, index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

StoreSchema.index({ status: 1, createdAt: -1 });
StoreSchema.index({ location: "2dsphere" });

export const Store = mongoose.model<IStore>("Store", StoreSchema);
