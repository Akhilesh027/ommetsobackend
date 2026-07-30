import mongoose, { Schema, Document } from "mongoose";
import { SafetyPriority } from "../../../contracts";

export interface ISafetyReport extends Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  targetType: "USER" | "LISTING" | "STORE" | "MESSAGE" | "REVIEW" | "ADVERTISEMENT";
  targetId: string;
  category: string; // "fraud", "prohibited", "harassment", "spam"
  description: string;
  evidenceImages?: string[];
  priority: SafetyPriority;
  assignedAdminId?: mongoose.Types.ObjectId;
  assignedAdminName?: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyReportSchema = new Schema<ISafetyReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: {
      type: String,
      enum: ["USER", "LISTING", "STORE", "MESSAGE", "REVIEW", "ADVERTISEMENT"],
      required: true,
      index: true
    },
    targetId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    evidenceImages: [{ type: String }],
    priority: { type: String, enum: Object.values(SafetyPriority), default: SafetyPriority.MEDIUM, index: true },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser", index: true },
    assignedAdminName: { type: String },
    status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
    resolutionNotes: { type: String }
  },
  { timestamps: true }
);

SafetyReportSchema.index({ status: 1, priority: -1, createdAt: -1 });

export const SafetyReport = mongoose.model<ISafetyReport>("SafetyReport", SafetyReportSchema);
