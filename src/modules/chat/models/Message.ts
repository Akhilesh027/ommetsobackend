import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  clientMessageId: string;
  senderId: mongoose.Types.ObjectId;
  recipientIds: mongoose.Types.ObjectId[];
  type: "TEXT" | "IMAGE" | "OFFER" | "SYSTEM";
  text?: string;
  imageUrl?: string;
  offerId?: mongoose.Types.ObjectId;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    clientMessageId: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    type: { type: String, enum: ["TEXT", "IMAGE", "OFFER", "SYSTEM"], default: "TEXT" },
    text: { type: String, maxlength: 2000 },
    imageUrl: { type: String },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer" },
    status: { type: String, enum: ["SENT", "DELIVERED", "READ", "FAILED"], default: "SENT", index: true },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
    readAt: { type: Date }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, senderId: 1, clientMessageId: 1 }, { unique: true });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
