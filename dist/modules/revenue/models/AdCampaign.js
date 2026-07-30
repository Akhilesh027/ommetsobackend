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
exports.AdCampaign = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdCampaignSchema = new mongoose_1.Schema({
    campaignType: { type: String, enum: ["LISTING_BOOST", "BANNER_AD"], required: true, index: true },
    advertiserUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["LISTING", "STORE"], default: "LISTING", index: true },
    listingId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Listing", index: true },
    storeId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Store", index: true },
    adProductId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdProduct" },
    placementIds: [{ type: String, required: true }],
    creativeAssetId: { type: mongoose_1.Schema.Types.ObjectId, ref: "MediaAsset" },
    bannerUrl: { type: String },
    targeting: {
        categoryIds: [{ type: String }],
        city: { type: String },
        pincodes: [{ type: String }]
    },
    pricing: {
        amountInPaise: { type: Number, required: true },
        taxInPaise: { type: Number, default: 0 },
        totalInPaise: { type: Number, required: true }
    },
    paymentStatus: {
        type: String,
        enum: ["NOT_STARTED", "PENDING", "FUNDS_HELD", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED"],
        default: "NOT_STARTED",
        index: true
    },
    status: {
        type: String,
        enum: [
            "DRAFT",
            "PAYMENT_PENDING",
            "SUBMITTED",
            "PENDING_REVIEW",
            "CHANGES_REQUIRED",
            "APPROVED",
            "SCHEDULED",
            "ACTIVE",
            "PAUSED",
            "REJECTED",
            "COMPLETED",
            "CANCELLED"
        ],
        default: "DRAFT",
        index: true
    },
    reviewDeadlineAt: { type: Date, index: true },
    reviewStartedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser" },
    assignedAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser" },
    rejectionReason: { type: String },
    requestedChanges: [{ type: String }],
    requestedStartAt: { type: Date },
    startAt: { type: Date },
    endAt: { type: Date },
    impressionsCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 }
}, { timestamps: true });
AdCampaignSchema.index({ status: 1, reviewDeadlineAt: 1 });
exports.AdCampaign = mongoose_1.default.model("AdCampaign", AdCampaignSchema);
