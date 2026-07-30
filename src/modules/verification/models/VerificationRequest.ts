import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationRequest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "mobile" | "email" | "identity" | "business";
  documentType?: "aadhaar" | "pan" | "driving_license" | "gstin";
  documentNumber?: string;
  documentImages?: string[];
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  assignedAdminId?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["mobile", "email", "identity", "business"], required: true, index: true },
    documentType: { type: String, enum: ["aadhaar", "pan", "driving_license", "gstin"] },
    documentNumber: { type: String },
    documentImages: [{ type: String }], // Private secure Cloudinary URLs
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    rejectionReason: { type: String },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

VerificationRequestSchema.index({ status: 1, createdAt: -1 });

export const VerificationRequest = mongoose.model<IVerificationRequest>("VerificationRequest", VerificationRequestSchema);
