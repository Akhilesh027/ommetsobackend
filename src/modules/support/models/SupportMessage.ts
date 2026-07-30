import mongoose, { Schema, Document } from "mongoose";

export interface ISupportMessage extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  senderType: "user" | "admin";
  senderUserId?: mongoose.Types.ObjectId;
  senderAdminId?: mongoose.Types.ObjectId;
  senderName: string;
  text: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true, index: true },
    senderType: { type: String, enum: ["user", "admin"], required: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: "User" },
    senderAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    attachments: [{ type: String }]
  },
  { timestamps: true }
);

SupportMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportMessage = mongoose.model<ISupportMessage>("SupportMessage", SupportMessageSchema);
