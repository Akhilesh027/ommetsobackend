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
exports.Category = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CategorySchema = new mongoose_1.Schema({
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    row: { type: Number, enum: [1, 2, 3], required: true },
    iconName: { type: String, required: true },
    subcategoriesLabel: { type: String },
    subcategories: [{ type: String }],
    filters: [{ type: String }],
    listingCardFields: [{ type: String }],
    detailsSpecFields: [{ type: String }],
    sellingFormFields: [{ type: String }],
    verificationBadges: [{ type: String }],
    sortOptions: [{ type: String }],
    compareAttributes: [{ type: String }],
    specialFeatures: [{ type: String }],
    specFields: [
        {
            name: { type: String, required: true },
            type: { type: String, enum: ["text", "number", "select", "boolean"], required: true },
            options: [{ type: String }],
            required: { type: Boolean, default: false }
        }
    ],
    isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
exports.Category = mongoose_1.default.model("Category", CategorySchema);
