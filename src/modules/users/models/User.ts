import mongoose, { Schema, Document } from "mongoose";
import { UserStatus } from "@omeetso/contracts";

export interface IUserProfile {
  name: string;
  avatar?: string;
  bio?: string;
  city: string;
  pincode: string;
  area?: string;
  language: string;
  memberSince: Date;
}

export interface IVerificationSummary {
  mobileVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  businessVerified: boolean;
  riskScore?: number;
}

export interface ISavedLocation {
  _id?: mongoose.Types.ObjectId;
  label: string;
  address: string;
  area: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  phone: string;
  email?: string;
  emailVerified: boolean;
  accountType: "individual" | "business";
  status: UserStatus;
  profile: IUserProfile;
  verificationSummary: IVerificationSummary;
  savedLocations: ISavedLocation[];
  blockedUserIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true },
    emailVerified: { type: Boolean, default: false },
    accountType: { type: String, enum: ["individual", "business"], default: "individual" },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE, index: true },
    profile: {
      name: { type: String, required: true, default: "Omeetso User" },
      avatar: { type: String },
      bio: { type: String },
      city: { type: String, required: true, default: "Hyderabad" },
      pincode: { type: String, required: true, default: "500081" },
      area: { type: String, default: "Madhapur" },
      language: { type: String, default: "en" },
      memberSince: { type: Date, default: Date.now }
    },
    verificationSummary: {
      mobileVerified: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      identityVerified: { type: Boolean, default: false },
      businessVerified: { type: Boolean, default: false },
      riskScore: { type: Number, default: 94 }
    },
    savedLocations: [
      {
        label: { type: String, required: true },
        address: { type: String, required: true },
        area: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
      }
    ],
    blockedUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
