"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listing = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@omeetso/contracts");
const ListingSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    storeId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Store", index: true },
    categoryId: { type: String, required: true, index: true },
    subcategoryId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priceInPaise: { type: Number, required: true, index: true },
    negotiable: { type: Boolean, default: true },
    free: { type: Boolean, default: false },
    condition: { type: String, required: true },
    images: [{ type: String, required: true }],
    coverIndex: { type: Number, default: 0 },
    videoUrl: { type: String },
    pincode: { type: String, required: true, index: true },
    area: { type: String, required: true },
    city: { type: String, required: true, default: "Hyderabad", index: true },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [78.3871, 17.4486] }
    },
    fulfilment: { type: String, required: true, default: "pickup" },
    specs: { type: Map, of: String, default: {} },
    contactPref: { type: String, default: "call_and_chat" },
    status: { type: String, enum: Object.values(contracts_1.ListingStatus), default: contracts_1.ListingStatus.SUBMITTED, index: true },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    rejection: {
        reason: { type: String },
        section: { type: String },
        correction: { type: String },
        date: { type: Date }
    },
    analytics: {
        views: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        chats: { type: Number, default: 0 }
    },
    aiAudit: {
        passed: { type: Boolean, default: true },
        resolution: { type: String, default: "1920x1080 (HD)" },
        noPhoneText: { type: Boolean, default: true },
        watermarkPassed: { type: Boolean, default: true }
    }
}, { timestamps: true });
// Indexes
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
ListingSchema.index({ status: 1, categoryId: 1, priceInPaise: 1 });
ListingSchema.index({ sellerId: 1, status: 1 });
ListingSchema.index({ location: "2dsphere" });
ListingSchema.index({ title: "text", description: "text" });
exports.Listing = mongoose_1.default.model("Listing", ListingSchema);
