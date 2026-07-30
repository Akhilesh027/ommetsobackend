"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directUpload = directUpload;
exports.signUpload = signUpload;
exports.completeUpload = completeUpload;
exports.deleteUpload = deleteUpload;
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const MediaAsset_1 = require("../models/MediaAsset");
const env_1 = require("../../../config/env");
async function directUpload(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { image, purpose } = req.body;
        if (!image) {
            res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Image content is required" } });
            return;
        }
        let url = image;
        if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_CLOUD_NAME !== "mock_cloud_name" && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
            cloudinary_1.default.v2.config({
                cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
                api_key: env_1.env.CLOUDINARY_API_KEY,
                api_secret: env_1.env.CLOUDINARY_API_SECRET
            });
            const result = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: `omeetso/${purpose || "listings"}`
            });
            url = result.secure_url;
        }
        res.status(200).json({
            success: true,
            data: {
                url
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function signUpload(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { purpose } = req.body;
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = `omeetso/${purpose || "general"}`;
        const publicId = `asset_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`;
        // Cloudinary signature generation (if configured)
        const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env_1.env.CLOUDINARY_API_SECRET}`;
        const signature = crypto_1.default.createHash("sha1").update(signatureString).digest("hex");
        res.status(200).json({
            success: true,
            data: {
                cloudName: env_1.env.CLOUDINARY_CLOUD_NAME,
                apiKey: env_1.env.CLOUDINARY_API_KEY,
                timestamp,
                folder,
                publicId,
                signature,
                uploadUrl: `https://api.cloudinary.com/v1_1/${env_1.env.CLOUDINARY_CLOUD_NAME}/auto/upload`
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function completeUpload(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { storageKey, secureUrl, purpose, isPrivate } = req.body;
        if (!storageKey || !secureUrl || !purpose) {
            res.status(400).json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "storageKey, secureUrl, and purpose are required" }
            });
            return;
        }
        const asset = await MediaAsset_1.MediaAsset.create({
            ownerUserId: req.user._id,
            purpose,
            storageKey,
            secureUrl,
            isPrivate: Boolean(isPrivate),
            status: "unattached"
        });
        res.status(201).json({
            success: true,
            data: {
                id: asset._id.toString(),
                secureUrl: asset.secureUrl,
                storageKey: asset.storageKey,
                purpose: asset.purpose,
                status: asset.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteUpload(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { mediaId } = req.params;
        const asset = await MediaAsset_1.MediaAsset.findById(mediaId);
        if (!asset) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Media asset not found" } });
            return;
        }
        if (asset.ownerUserId.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot delete another user's file" } });
            return;
        }
        asset.status = "deleted";
        await asset.save();
        res.status(200).json({
            success: true,
            data: { message: "Media asset marked deleted" }
        });
    }
    catch (error) {
        next(error);
    }
}
