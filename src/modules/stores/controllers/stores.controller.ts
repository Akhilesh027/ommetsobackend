import { Request, Response, NextFunction } from "express";
import { Store } from "../models/Store";
import { StoreMember } from "../models/StoreMember";
import { Listing } from "../../listings/models/Listing";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { StoreStatus, ListingStatus } from "@omeetso/contracts";

export async function createStore(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const {
      name,
      tagline,
      description,
      businessType,
      logo,
      cover,
      primaryCategory,
      supportingCategories,
      pincode,
      area,
      city,
      address,
      businessMobile,
      email,
      website,
      workingHours,
      delivery
    } = req.body;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
    const ownerId = req.user._id;

    const store = await Store.create({
      ownerId,
      name,
      slug,
      tagline,
      description,
      businessType: businessType || "Retailer",
      logo,
      cover,
      primaryCategory,
      supportingCategories: supportingCategories || [],
      pincode: pincode || req.user.profile.pincode,
      area: area || req.user.profile.area || "Madhapur",
      city: city || req.user.profile.city || "Hyderabad",
      address: address || "Madhapur Main Rd",
      businessMobile: businessMobile || req.user.phone,
      email: email || req.user.email || "store@omeetso.com",
      website,
      workingHours: workingHours || [],
      delivery: delivery || {},
      status: StoreStatus.SUBMITTED
    });

    await StoreMember.create({
      storeId: store._id,
      userId: ownerId,
      role: "owner",
      permissions: ["*"],
      status: "active"
    });

    res.status(201).json({
      success: true,
      data: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        status: store.status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicStores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      status: { $in: [StoreStatus.APPROVED, StoreStatus.ACTIVE, "active", "APPROVED", "ACTIVE"] }
    };

    if (req.query.category) query.primaryCategory = req.query.category;
    if (req.query.city) query.city = req.query.city;
    if (req.query.pincode) query.pincode = req.query.pincode;
    if (req.query.area) query.area = new RegExp(req.query.area as string, "i");

    const [stores, total] = await Promise.all([
      Store.find(query)
        .select("name slug tagline description logo cover primaryCategory area city rating reviewCount followersCount status")
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Store.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: stores.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description,
        logo: s.logo,
        cover: s.cover,
        primaryCategory: s.primaryCategory,
        area: s.area,
        city: s.city,
        rating: s.rating,
        reviewCount: s.reviewCount,
        followersCount: s.followersCount,
        status: s.status
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

export async function getStoreById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const storeId = (req.params.storeId || req.params.id) as string;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(storeId);
    const store = isObjectId
      ? await Store.findById(storeId).lean()
      : await Store.findOne({ $or: [{ slug: storeId }, { name: new RegExp(`^${storeId}$`, "i") }] }).lean();

    if (!store) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: store._id.toString(),
        ownerId: store.ownerId.toString(),
        name: store.name,
        slug: store.slug,
        tagline: store.tagline,
        description: store.description,
        businessType: store.businessType,
        logo: store.logo,
        cover: store.cover,
        primaryCategory: store.primaryCategory,
        supportingCategories: store.supportingCategories,
        pincode: store.pincode,
        area: store.area,
        city: store.city,
        address: store.address,
        businessMobile: store.businessMobile,
        email: store.email,
        website: store.website,
        gstin: store.gstin || "36AABCU9603R1ZM",
        workingHours: store.workingHours,
        delivery: store.delivery,
        status: store.status,
        rating: store.rating,
        reviewCount: store.reviewCount,
        followersCount: store.followersCount
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyStores(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const stores = await Store.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: stores.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        slug: s.slug,
        logo: s.logo,
        primaryCategory: s.primaryCategory,
        status: s.status,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getStoreListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { storeId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(storeId);
    const targetStore = isObjectId ? await Store.findById(storeId).lean() : await Store.findOne({ slug: storeId }).lean();

    const query: Record<string, any> = {
      status: { $in: [ListingStatus.APPROVED, ListingStatus.ACTIVE, ListingStatus.SUBMITTED, "APPROVED", "ACTIVE", "SUBMITTED", "approved", "active", "submitted", "under_review"] }
    };

    if (targetStore) {
      query.$or = [{ storeId: targetStore._id.toString() }, { sellerId: targetStore.ownerId }];
    } else {
      query.storeId = storeId;
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .select("title priceInPaise condition area city coverIndex images status createdAt sellerId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Listing.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: listings.map((l: any) => ({
        id: l._id.toString(),
        title: l.title,
        priceInPaise: l.priceInPaise,
        price: l.priceInPaise ? l.priceInPaise / 100 : l.price || 0,
        condition: l.condition,
        coverUrl: l.images[l.coverIndex || 0] || l.images[0],
        images: l.images,
        area: l.area,
        city: l.city,
        status: l.status,
        createdAt: l.createdAt
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

export async function updateStore(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { storeId } = req.params;
    const { name, tagline, description, logo, cover, primaryCategory, pincode, area, city, address, businessMobile, email, website } = req.body;

    const updateFields: Record<string, any> = {};
    if (name) updateFields.name = name;
    if (tagline !== undefined) updateFields.tagline = tagline;
    if (description !== undefined) updateFields.description = description;
    if (logo !== undefined) updateFields.logo = logo;
    if (cover !== undefined) updateFields.cover = cover;
    if (primaryCategory) updateFields.primaryCategory = primaryCategory;
    if (pincode) updateFields.pincode = pincode;
    if (area) updateFields.area = area;
    if (city) updateFields.city = city;
    if (address !== undefined) updateFields.address = address;
    if (businessMobile) updateFields.businessMobile = businessMobile;
    if (email) updateFields.email = email;
    if (website !== undefined) updateFields.website = website;

    const updatedStore = await Store.findOneAndUpdate(
      { _id: storeId, ownerId: req.user._id },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStore) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found or unauthorized" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    next(error);
  }
}
