import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  contextType: "LISTING" | "STORE";
  contextId: mongoose.Types.ObjectId;
  listingId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  participantIds: mongoose.Types.ObjectId[];
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessagePreview?: string;
  lastMessageType?: "TEXT" | "IMAGE" | "OFFER" | "SYSTEM";
  lastMessageAt?: Date;
  lastSenderId?: mongoose.Types.ObjectId;
  unreadCounts: { userId: mongoose.Types.ObjectId; count: number }[];
  status: "ACTIVE" | "ARCHIVED" | "BLOCKED";
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    contextType: { type: String, enum: ["LISTING", "STORE"], required: true, default: "LISTING" },
    contextId: { type: Schema.Types.ObjectId, required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    participantIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true, index: true }],
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessagePreview: { type: String },
    lastMessageType: { type: String, enum: ["TEXT", "IMAGE", "OFFER", "SYSTEM"], default: "TEXT" },
    lastMessageAt: { type: Date, default: Date.now },
    lastSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    unreadCounts: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 }
      }
    ],
    status: { type: String, enum: ["ACTIVE", "ARCHIVED", "BLOCKED"], default: "ACTIVE", index: true }
  },
  { timestamps: true }
);

ConversationSchema.index({ participantIds: 1, updatedAt: -1 });
ConversationSchema.index({ buyerId: 1, sellerId: 1, contextType: 1, contextId: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);
