import mongoose, { Schema, Document } from "mongoose";

export interface IStoreMember extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "manager" | "staff";
  permissions: string[];
  status: "active" | "invited" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const StoreMemberSchema = new Schema<IStoreMember>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["owner", "manager", "staff"], default: "owner" },
    permissions: [{ type: String }],
    status: { type: String, enum: ["active", "invited", "suspended"], default: "active" }
  },
  { timestamps: true }
);

StoreMemberSchema.index({ storeId: 1, userId: 1 }, { unique: true });

export const StoreMember = mongoose.model<IStoreMember>("StoreMember", StoreMemberSchema);
