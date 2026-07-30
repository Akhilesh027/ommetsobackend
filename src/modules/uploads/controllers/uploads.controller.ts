import { Response, NextFunction } from "express";
import crypto from "crypto";
import cloudinary from "cloudinary";
import { MediaAsset } from "../models/MediaAsset";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { env } from "../../../config/env";

export async function directUpload(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
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
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_CLOUD_NAME !== "mock_cloud_name" && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.v2.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
      });
      const result = await cloudinary.v2.uploader.upload(image, {
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
  } catch (error) {
    next(error);
  }
}

export async function signUpload(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { purpose } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `omeetso/${purpose || "general"}`;
    const publicId = `asset_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Cloudinary signature generation (if configured)
    const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    res.status(200).json({
      success: true,
      data: {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        publicId,
        signature,
        uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function completeUpload(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
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

    const asset = await MediaAsset.create({
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
  } catch (error) {
    next(error);
  }
}

export async function deleteUpload(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { mediaId } = req.params;
    const asset = await MediaAsset.findById(mediaId);

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
  } catch (error) {
    next(error);
  }
}
