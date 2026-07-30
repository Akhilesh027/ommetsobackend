import mongoose, { Schema, Document } from "mongoose";

export interface IListingRevision extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priceInPaise: number;
  condition: string;
  images: string[];
  specs: Map<string, string>;
  status: "pending_review" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ListingRevisionSchema = new Schema<IListingRevision>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priceInPaise: { type: Number, required: true },
    condition: { type: String, required: true },
    images: [{ type: String, required: true }],
    specs: { type: Map, of: String, default: {} },
    status: { type: String, enum: ["pending_review", "approved", "rejected"], default: "pending_review", index: true }
  },
  { timestamps: true }
);

export const ListingRevision = mongoose.model<IListingRevision>("ListingRevision", ListingRevisionSchema);
