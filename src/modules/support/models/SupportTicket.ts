import mongoose, { Schema, Document } from "mongoose";
import { SupportPriority, SupportStatus } from "../../../contracts";

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: string; // "account", "billing", "listing", "verification", "general"
  priority: SupportPriority;
  status: SupportStatus;
  assignedAdminId?: mongoose.Types.ObjectId;
  assignedAdminName?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: Object.values(SupportPriority), default: SupportPriority.MEDIUM, index: true },
    status: { type: String, enum: Object.values(SupportStatus), default: SupportStatus.OPEN, index: true },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser", index: true },
    assignedAdminName: { type: String },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, updatedAt: -1 });

export const SupportTicket = mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);
