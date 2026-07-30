import mongoose, { Schema, Document } from "mongoose";

export interface ICategoryAttribute {
  name: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  required?: boolean;
}

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  categoryId: string; // e.g. "cars", "mobiles"
  name: string;
  row: 1 | 2 | 3;
  iconName: string;
  subcategoriesLabel?: string;
  subcategories: string[];
  filters: string[];
  listingCardFields: string[];
  detailsSpecFields: string[];
  sellingFormFields: string[];
  verificationBadges: string[];
  sortOptions: string[];
  compareAttributes?: string[];
  specialFeatures?: string[];
  specFields?: ICategoryAttribute[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    row: { type: Number, enum: [1, 2, 3], required: true },
    iconName: { type: String, required: true },
    subcategoriesLabel: { type: String },
    subcategories: [{ type: String }],
    filters: [{ type: String }],
    listingCardFields: [{ type: String }],
    detailsSpecFields: [{ type: String }],
    sellingFormFields: [{ type: String }],
    verificationBadges: [{ type: String }],
    sortOptions: [{ type: String }],
    compareAttributes: [{ type: String }],
    specialFeatures: [{ type: String }],
    specFields: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ["text", "number", "select", "boolean"], required: true },
        options: [{ type: String }],
        required: { type: Boolean, default: false }
      }
    ],
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
