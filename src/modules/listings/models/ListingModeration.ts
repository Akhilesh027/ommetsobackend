import mongoose, { Schema, Document } from "mongoose";

export interface IListingModeration extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  assignedAdminId?: mongoose.Types.ObjectId;
  assignedAdminName?: string;
  lockedAt?: Date;
  status: "unassigned" | "assigned" | "under_review" | "completed";
  reviewNotes?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingModerationSchema = new Schema<IListingModeration>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, unique: true, index: true },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser", index: true },
    assignedAdminName: { type: String },
    lockedAt: { type: Date },
    status: { type: String, enum: ["unassigned", "assigned", "under_review", "completed"], default: "unassigned", index: true },
    reviewNotes: { type: String },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const ListingModeration = mongoose.model<IListingModeration>("ListingModeration", ListingModerationSchema);
