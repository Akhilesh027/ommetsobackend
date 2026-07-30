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
exports.SafetyReport = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const contracts_1 = require("@omeetso/contracts");
const SafetyReportSchema = new mongoose_1.Schema({
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
    priority: { type: String, enum: Object.values(contracts_1.SafetyPriority), default: contracts_1.SafetyPriority.MEDIUM, index: true },
    assignedAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser", index: true },
    assignedAdminName: { type: String },
    status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
    resolutionNotes: { type: String }
}, { timestamps: true });
SafetyReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
exports.SafetyReport = mongoose_1.default.model("SafetyReport", SafetyReportSchema);
