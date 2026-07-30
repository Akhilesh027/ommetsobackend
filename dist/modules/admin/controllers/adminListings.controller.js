"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminListings = getAdminListings;
exports.approveListing = approveListing;
exports.rejectListing = rejectListing;
const Listing_1 = require("../../listings/models/Listing");
const ListingModeration_1 = require("../../listings/models/ListingModeration");
const AuditLog_1 = require("../models/AuditLog");
const contracts_1 = require("@omeetso/contracts");
async function getAdminListings(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status && req.query.status !== "ALL" && req.query.status !== "all") {
            const st = req.query.status;
            query.status = { $in: [st, st.toUpperCase(), st.toLowerCase()] };
        }
        if (req.query.categoryId)
            query.categoryId = req.query.categoryId;
        const [listings, total] = await Promise.all([
            Listing_1.Listing.find(query)
                .populate("sellerId", "profile.name phone email verificationSummary")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Listing_1.Listing.countDocuments(query)
        ]);
        const items = listings.map((l) => ({
            id: l._id.toString(),
            title: l.title,
            description: l.description,
            priceInPaise: l.priceInPaise,
            condition: l.condition,
            categoryId: l.categoryId,
            subcategoryId: l.subcategoryId,
            images: l.images,
            coverIndex: l.coverIndex,
            pincode: l.pincode,
            area: l.area,
            city: l.city,
            status: l.status,
            createdAt: l.createdAt,
            seller: l.sellerId
                ? {
                    id: l.sellerId._id.toString(),
                    name: l.sellerId.profile?.name || (l.sellerId.phone ? `User (${l.sellerId.phone})` : "Omeetso Seller"),
                    phone: l.sellerId.phone,
                    email: l.sellerId.email,
                    verified: Boolean(l.sellerId.verificationSummary?.mobileVerified)
                }
                : undefined
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
async function approveListing(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { listingId } = req.params;
        const listing = await Listing_1.Listing.findById(listingId);
        if (!listing) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
            return;
        }
        const beforeState = { status: listing.status };
        listing.status = contracts_1.ListingStatus.APPROVED;
        listing.publishedAt = new Date();
        listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await listing.save();
        // Update Moderation record
        await ListingModeration_1.ListingModeration.findOneAndUpdate({ listingId: listing._id }, {
            assignedAdminId: req.admin._id,
            assignedAdminName: req.admin.name,
            status: "completed",
            reviewNotes: "Listing approved by moderator"
        }, { upsert: true });
        // Create Server Audit Log (Server-derived actorAdminId)
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: "LISTING_APPROVE",
            targetType: "Listing",
            targetId: listing._id.toString(),
            reason: req.body.reason || "Listing meets platform guidelines",
            before: beforeState,
            after: { status: listing.status },
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: listing._id.toString(),
                title: listing.title,
                status: listing.status,
                publishedAt: listing.publishedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function rejectListing(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { listingId } = req.params;
        const { reason, section, correction } = req.body;
        const listing = await Listing_1.Listing.findById(listingId);
        if (!listing) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Listing not found" } });
            return;
        }
        const beforeState = { status: listing.status };
        listing.status = contracts_1.ListingStatus.REJECTED;
        listing.rejection = {
            reason: reason || "Listing violates platform content policies",
            section,
            correction,
            date: new Date()
        };
        await listing.save();
        await ListingModeration_1.ListingModeration.findOneAndUpdate({ listingId: listing._id }, {
            assignedAdminId: req.admin._id,
            assignedAdminName: req.admin.name,
            status: "completed",
            reviewNotes: reason
        }, { upsert: true });
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: "LISTING_REJECT",
            targetType: "Listing",
            targetId: listing._id.toString(),
            reason: reason || "Content policy violation",
            before: beforeState,
            after: { status: listing.status },
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: listing._id.toString(),
                status: listing.status,
                rejection: listing.rejection
            }
        });
    }
    catch (error) {
        next(error);
    }
}
