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
exports.Store = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@omeetso/contracts");
const StoreSchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    tagline: { type: String },
    description: { type: String, required: true },
    businessType: { type: String, required: true, default: "Retailer" },
    logo: { type: String },
    cover: { type: String },
    primaryCategory: { type: String, required: true, index: true },
    supportingCategories: [{ type: String }],
    pincode: { type: String, required: true, index: true },
    area: { type: String, required: true },
    city: { type: String, required: true, default: "Hyderabad", index: true },
    address: { type: String, required: true },
    gstin: { type: String, default: "36AABCU9603R1ZM" },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [78.3871, 17.4486] }
    },
    businessMobile: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    workingHours: [
        {
            day: { type: String, required: true },
            closed: { type: Boolean, default: false },
            open: { type: String, default: "10:00" },
            close: { type: String, default: "21:00" }
        }
    ],
    is24x7: { type: Boolean, default: false },
    delivery: {
        pickup: { type: Boolean, default: true },
        localDelivery: { type: Boolean, default: true },
        buyerPickup: { type: Boolean, default: true },
        radiusKm: { type: Number, default: 10 },
        chargeInPaise: { type: Number, default: 5000 },
        freeAboveInPaise: { type: Number, default: 50000 }
    },
    status: { type: String, enum: Object.values(contracts_1.StoreStatus), default: contracts_1.StoreStatus.SUBMITTED, index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    publishedAt: { type: Date }
}, { timestamps: true });
StoreSchema.index({ status: 1, createdAt: -1 });
StoreSchema.index({ location: "2dsphere" });
exports.Store = mongoose_1.default.model("Store", StoreSchema);
