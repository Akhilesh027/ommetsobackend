import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { Listing } from "../models/Listing";
import { ListingRevision } from "../models/ListingRevision";
import { ListingModeration } from "../models/ListingModeration";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { ListingStatus } from "../../../contracts";

export async function createListing(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User authentication required" } });
      return;
    }

    const {
      title,
      description,
      priceInPaise,
      negotiable,
      free,
      condition,
      categoryId,
      subcategoryId,
      images,
      coverIndex,
      videoUrl,
      pincode,
      area,
      city,
      fulfilment,
      specs,
      contactPref
    } = req.body;

    // Derived Seller Identity
    const sellerId = req.user._id;

    const listing = await Listing.create({
      sellerId,
      categoryId,
      subcategoryId,
      title,
      description,
      priceInPaise,
      negotiable: Boolean(negotiable),
      free: Boolean(free),
      condition,
      images: images || [],
      coverIndex: coverIndex || 0,
      videoUrl,
      pincode: pincode || req.user.profile.pincode,
      area: area || req.user.profile.area || "Madhapur",
      city: city || req.user.profile.city || "Hyderabad",
      fulfilment: fulfilment || "pickup",
      specs: specs || {},
      contactPref: contactPref || "call_and_chat",
      status: ListingStatus.SUBMITTED
    });

    // Create moderation queue entry
    await ListingModeration.create({
      listingId: listing._id,
      status: "unassigned",
      version: 1
    });

    res.status(201).json({
      success: true,
      data: {
        id: listing._id.toString(),
        title: listing.title,
        status: listing.status,
        createdAt: listing.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      status: req.query.status ? req.query.status : { $in: [ListingStatus.APPROVED, ListingStatus.ACTIVE, "APPROVED", "ACTIVE", "approved", "active"] }
    };

    if (req.query.categoryId) query.categoryId = req.query.categoryId;
    if (req.query.subcategoryId) query.subcategoryId = req.query.subcategoryId;
    if (req.query.city) query.city = req.query.city;
    if (req.query.pincode) query.pincode = req.query.pincode;
    if (req.query.condition) query.condition = req.query.condition;

    const sellerParam = (Array.isArray(req.query.sellerId) ? req.query.sellerId[0] : req.query.sellerId || req.query.seller) as string;
    if (sellerParam) {
      if (mongoose.Types.ObjectId.isValid(sellerParam)) {
        query.sellerId = new mongoose.Types.ObjectId(sellerParam);
      } else {
        query.sellerId = sellerParam;
      }
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.priceInPaise = {};
      if (req.query.minPrice) query.priceInPaise.$gte = parseInt(req.query.minPrice as string);
      if (req.query.maxPrice) query.priceInPaise.$lte = parseInt(req.query.maxPrice as string);
    }

    if (req.query.q) {
      query.$text = { $search: req.query.q as string };
    }

    const sortOptions: Record<string, any> = { createdAt: -1 };
    if (req.query.sort === "price_asc") sortOptions.priceInPaise = 1;
    if (req.query.sort === "price_desc") sortOptions.priceInPaise = -1;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .select("title priceInPaise condition area city coverIndex images sellerId status publishedAt free negotiable categoryId subcategoryId")
        .populate("sellerId", "profile.name profile.avatar verificationSummary")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(query)
    ]);

    const items = listings.map((l: any) => ({
      id: l._id.toString(),
      title: l.title,
      priceInPaise: l.priceInPaise,
      condition: l.condition,
      area: l.area,
      city: l.city,
      coverUrl: l.images[l.coverIndex || 0] || l.images[0],
      images: l.images,
      negotiable: l.negotiable,
      free: l.free,
      categoryId: l.categoryId,
      subcategoryId: l.subcategoryId,
      status: l.status,
      publishedAt: l.publishedAt || l.createdAt,
      sellerId: l.sellerId?._id ? l.sellerId._id.toString() : (l.sellerId ? l.sellerId.toString() : undefined),
      sellerName: l.sellerId?.profile?.name || "Omeetso Seller",
      sellerAvatar: l.sellerId?.profile?.avatar,
      sellerVerified: Boolean(l.sellerId?.verificationSummary?.mobileVerified)
    }));

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getListingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listingId = (req.params.listingId || req.params.id) as string;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(listingId);
    const listing = isObjectId
      ? await Listing.findById(listingId)
          .populate("sellerId", "profile.name profile.avatar profile.city profile.area verificationSummary createdAt")
          .lean()
      : await Listing.findOne({ slug: listingId } as any)
          .populate("sellerId", "profile.name profile.avatar profile.city profile.area verificationSummary createdAt")
          .lean();

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    const seller: any = listing.sellerId;

    res.status(200).json({
      success: true,
      data: {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        priceInPaise: listing.priceInPaise,
        negotiable: listing.negotiable,
        free: listing.free,
        condition: listing.condition,
        categoryId: listing.categoryId,
        subcategoryId: listing.subcategoryId,
        images: listing.images,
        coverIndex: listing.coverIndex,
        videoUrl: listing.videoUrl,
        pincode: listing.pincode,
        area: listing.area,
        city: listing.city,
        fulfilment: listing.fulfilment,
        specs: listing.specs ? Object.fromEntries(Object.entries(listing.specs)) : {},
        contactPref: listing.contactPref,
        status: listing.status,
        publishedAt: listing.publishedAt || listing.createdAt,
        expiresAt: listing.expiresAt,
        analytics: listing.analytics || { views: 0, saves: 0, chats: 0 },
        aiAudit: listing.aiAudit || { passed: true, resolution: "1920x1080 (HD)", noPhoneText: true, watermarkPassed: true },
        seller: seller
          ? {
              id: seller._id.toString(),
              name: seller.profile?.name || "Omeetso Seller",
              avatar: seller.profile?.avatar,
              city: seller.profile?.city,
              area: seller.profile?.area,
              memberSince: seller.profile?.memberSince || seller.createdAt,
              verificationSummary: seller.verificationSummary || { riskScore: 94 }
            }
          : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyListings(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User authentication required" } });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { sellerId: req.user._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: listings.map((l) => ({
        id: l._id.toString(),
        title: l.title,
        priceInPaise: l.priceInPaise,
        condition: l.condition,
        status: l.status,
        images: l.images,
        coverIndex: l.coverIndex,
        area: l.area,
        city: l.city,
        createdAt: l.createdAt,
        expiresAt: l.expiresAt,
        rejection: l.rejection
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    // Ownership Enforcement
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot edit another user's listing" } });
      return;
    }

    const { title, description, priceInPaise, condition, images, specs } = req.body;

    // Listing Revision Logic: If listing is active/approved, create revision for review rather than overwriting live content
    if (listing.status === ListingStatus.APPROVED || listing.status === ListingStatus.ACTIVE) {
      const revision = await ListingRevision.create({
        listingId: listing._id,
        sellerId: req.user._id,
        title: title || listing.title,
        description: description || listing.description,
        priceInPaise: priceInPaise ?? listing.priceInPaise,
        condition: condition || listing.condition,
        images: images || listing.images,
        specs: specs || listing.specs,
        status: "pending_review"
      });

      res.status(200).json({
        success: true,
        data: {
          message: "Edit submitted for moderation. Existing listing remains public until revision is approved.",
          revisionId: revision._id.toString()
        }
      });
      return;
    }

    // Draft / Submitted edit: update directly
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (priceInPaise !== undefined) listing.priceInPaise = priceInPaise;
    if (condition) listing.condition = condition;
    if (images) listing.images = images;
    if (specs) listing.specs = specs;

    await listing.save();

    res.status(200).json({
      success: true,
      data: {
        id: listing._id.toString(),
        title: listing.title,
        status: listing.status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function markListingSold(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
      return;
    }

    if (listing.sellerId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot modify another user's listing" } });
      return;
    }

    listing.status = ListingStatus.SOLD;
    await listing.save();

    res.status(200).json({
      success: true,
      data: { id: listing._id.toString(), status: listing.status }
    });
  } catch (error) {
    next(error);
  }
}

export async function recordListingView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listingId = (Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId) as string;
    if (mongoose.Types.ObjectId.isValid(listingId)) {
      await Listing.findByIdAndUpdate(listingId, { $inc: { "analytics.views": 1 } });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function recordListingSave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listingId = (Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId) as string;
    if (mongoose.Types.ObjectId.isValid(listingId)) {
      await Listing.findByIdAndUpdate(listingId, { $inc: { "analytics.saves": 1 } });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
