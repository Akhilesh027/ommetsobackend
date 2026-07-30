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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@omeetso/contracts");
const UserSchema = new mongoose_1.Schema({
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true },
    emailVerified: { type: Boolean, default: false },
    accountType: { type: String, enum: ["individual", "business"], default: "individual" },
    status: { type: String, enum: Object.values(contracts_1.UserStatus), default: contracts_1.UserStatus.ACTIVE, index: true },
    profile: {
        name: { type: String, required: true, default: "Omeetso User" },
        avatar: { type: String },
        bio: { type: String },
        city: { type: String, required: true, default: "Hyderabad" },
        pincode: { type: String, required: true, default: "500081" },
        area: { type: String, default: "Madhapur" },
        language: { type: String, default: "en" },
        memberSince: { type: Date, default: Date.now }
    },
    verificationSummary: {
        mobileVerified: { type: Boolean, default: true },
        emailVerified: { type: Boolean, default: false },
        identityVerified: { type: Boolean, default: false },
        businessVerified: { type: Boolean, default: false },
        riskScore: { type: Number, default: 94 }
    },
    savedLocations: [
        {
            label: { type: String, required: true },
            address: { type: String, required: true },
            area: { type: String, required: true },
            pincode: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }
    ],
    blockedUserIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
exports.User = mongoose_1.default.model("User", UserSchema);
