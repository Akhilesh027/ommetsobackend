"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListing = createListing;
exports.getPublicListings = getPublicListings;
exports.getListingById = getListingById;
exports.getMyListings = getMyListings;
exports.updateListing = updateListing;
exports.markListingSold = markListingSold;
const Listing_1 = require("../models/Listing");
const ListingRevision_1 = require("../models/ListingRevision");
const ListingModeration_1 = require("../models/ListingModeration");
const contracts_1 = require("@omeetso/contracts");
async function createListing(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User authentication required" } });
            return;
        }
        const { title, description, priceInPaise, negotiable, free, condition, categoryId, subcategoryId, images, coverIndex, videoUrl, pincode, area, city, fulfilment, specs, contactPref } = req.body;
        // Derived Seller Identity
        const sellerId = req.user._id;
        const listing = await Listing_1.Listing.create({
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
            status: contracts_1.ListingStatus.SUBMITTED
        });
        // Create moderation queue entry
        await ListingModeration_1.ListingModeration.create({
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
    }
    catch (error) {
        next(error);
    }
}
async function getPublicListings(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const query = {
            status: req.query.status ? req.query.status : { $in: [contracts_1.ListingStatus.APPROVED, contracts_1.ListingStatus.ACTIVE, "APPROVED", "ACTIVE", "approved", "active"] }
        };
        if (req.query.categoryId)
            query.categoryId = req.query.categoryId;
        if (req.query.subcategoryId)
            query.subcategoryId = req.query.subcategoryId;
        if (req.query.city)
            query.city = req.query.city;
        if (req.query.pincode)
            query.pincode = req.query.pincode;
        if (req.query.condition)
            query.condition = req.query.condition;
        if (req.query.minPrice || req.query.maxPrice) {
            query.priceInPaise = {};
            if (req.query.minPrice)
                query.priceInPaise.$gte = parseInt(req.query.minPrice);
            if (req.query.maxPrice)
                query.priceInPaise.$lte = parseInt(req.query.maxPrice);
        }
        if (req.query.q) {
            query.$text = { $search: req.query.q };
        }
        const sortOptions = { createdAt: -1 };
        if (req.query.sort === "price_asc")
            sortOptions.priceInPaise = 1;
        if (req.query.sort === "price_desc")
            sortOptions.priceInPaise = -1;
        const [listings, total] = await Promise.all([
            Listing_1.Listing.find(query)
                .select("title priceInPaise condition area city coverIndex images sellerId status publishedAt free negotiable categoryId subcategoryId")
                .populate("sellerId", "profile.name profile.avatar verificationSummary")
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            Listing_1.Listing.countDocuments(query)
        ]);
        const items = listings.map((l) => ({
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
    }
    catch (error) {
        next(error);
    }
}
async function getListingById(req, res, next) {
    try {
        const { listingId } = req.params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(listingId);
        const listing = isObjectId
            ? await Listing_1.Listing.findById(listingId)
                .populate("sellerId", "profile.name profile.avatar profile.city profile.area verificationSummary createdAt")
                .lean()
            : await Listing_1.Listing.findOne({ slug: listingId })
                .populate("sellerId", "profile.name profile.avatar profile.city profile.area verificationSummary createdAt")
                .lean();
        if (!listing) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
            return;
        }
        const seller = listing.sellerId;
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
    }
    catch (error) {
        next(error);
    }
}
async function getMyListings(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User authentication required" } });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const query = { sellerId: req.user._id };
        if (req.query.status) {
            query.status = req.query.status;
        }
        const [listings, total] = await Promise.all([
            Listing_1.Listing.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Listing_1.Listing.countDocuments(query)
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
    }
    catch (error) {
        next(error);
    }
}
async function updateListing(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { listingId } = req.params;
        const listing = await Listing_1.Listing.findById(listingId);
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
        if (listing.status === contracts_1.ListingStatus.APPROVED || listing.status === contracts_1.ListingStatus.ACTIVE) {
            const revision = await ListingRevision_1.ListingRevision.create({
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
        if (title)
            listing.title = title;
        if (description)
            listing.description = description;
        if (priceInPaise !== undefined)
            listing.priceInPaise = priceInPaise;
        if (condition)
            listing.condition = condition;
        if (images)
            listing.images = images;
        if (specs)
            listing.specs = specs;
        await listing.save();
        res.status(200).json({
            success: true,
            data: {
                id: listing._id.toString(),
                title: listing.title,
                status: listing.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function markListingSold(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { listingId } = req.params;
        const listing = await Listing_1.Listing.findById(listingId);
        if (!listing) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
            return;
        }
        if (listing.sellerId.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Cannot modify another user's listing" } });
            return;
        }
        listing.status = contracts_1.ListingStatus.SOLD;
        await listing.save();
        res.status(200).json({
            success: true,
            data: { id: listing._id.toString(), status: listing.status }
        });
    }
    catch (error) {
        next(error);
    }
}
