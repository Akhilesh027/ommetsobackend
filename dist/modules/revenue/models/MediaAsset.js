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
exports.MediaAsset = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MediaAssetSchema = new mongoose_1.Schema({
    ownerUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, enum: ["AD_CREATIVE", "LISTING_IMAGE", "STORE_LOGO"], default: "AD_CREATIVE", index: true },
    storageKey: { type: String, required: true },
    secureUrl: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    mimeType: { type: String, required: true },
    sizeInBytes: { type: Number, required: true },
    moderationStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "APPROVED", index: true }
}, { timestamps: true });
exports.MediaAsset = mongoose_1.default.model("MediaAsset", MediaAssetSchema);
