"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyWallet = getMyWallet;
exports.getAdProducts = getAdProducts;
exports.getAdPlacements = getAdPlacements;
exports.createAdPlacement = createAdPlacement;
exports.deleteAdPlacement = deleteAdPlacement;
exports.createAdCampaign = createAdCampaign;
exports.submitAdCampaign = submitAdCampaign;
exports.getMyAdCampaigns = getMyAdCampaigns;
exports.getAdminAdCampaigns = getAdminAdCampaigns;
exports.approveAdminAdCampaign = approveAdminAdCampaign;
exports.rejectAdminAdCampaign = rejectAdminAdCampaign;
exports.serveAds = serveAds;
exports.trackAdImpression = trackAdImpression;
exports.trackAdClick = trackAdClick;
exports.getCampaignAnalytics = getCampaignAnalytics;
exports.getAdminRevenueAnalytics = getAdminRevenueAnalytics;
const mongoose_1 = __importDefault(require("mongoose"));
const Wallet_1 = require("../models/Wallet");
const WalletTransaction_1 = require("../models/WalletTransaction");
const WalletHold_1 = require("../models/WalletHold");
const AdProduct_1 = require("../models/AdProduct");
const AdPlacement_1 = require("../models/AdPlacement");
const AdCampaign_1 = require("../models/AdCampaign");
const Listing_1 = require("../../listings/models/Listing");
const AdAnalytics_1 = require("../models/AdAnalytics");
async function getMyWallet(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        let wallet = await Wallet_1.Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet_1.Wallet.create({ userId: req.user._id, balanceInPaise: 500000, refundBalanceInPaise: 0 }); // Initial ₹5,000 promo credit
        }
        const [transactions, holds] = await Promise.all([
            WalletTransaction_1.WalletTransaction.find({ walletId: wallet._id }).sort({ createdAt: -1 }).limit(30).lean(),
            WalletHold_1.WalletHold.find({ userId: req.user._id, status: "HELD" }).lean()
        ]);
        const totalHeldInPaise = holds.reduce((sum, h) => sum + h.amountInPaise, 0);
        res.status(200).json({
            success: true,
            data: {
                id: wallet._id.toString(),
                balanceInPaise: wallet.balanceInPaise,
                availableBalanceInPaise: wallet.balanceInPaise - totalHeldInPaise,
                heldBalanceInPaise: totalHeldInPaise,
                refundBalanceInPaise: wallet.refundBalanceInPaise,
                transactions: transactions.map((t) => ({
                    id: t._id.toString(),
                    type: t.type,
                    amountInPaise: t.amountInPaise,
                    description: t.description,
                    referenceType: t.referenceType,
                    status: t.status,
                    createdAt: t.createdAt
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdProducts(req, res, next) {
    try {
        const products = await AdProduct_1.AdProduct.find({ active: true }).sort({ priceInPaise: 1 }).lean();
        res.status(200).json({
            success: true,
            data: products.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                description: p.description,
                campaignType: p.campaignType,
                durationDays: p.durationDays,
                priceInPaise: p.priceInPaise,
                permittedPlacements: p.permittedPlacements
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdPlacements(req, res, Next) {
    try {
        const placements = await AdPlacement_1.AdPlacement.find({ active: true }).lean();
        const activeCampaigns = await AdCampaign_1.AdCampaign.find({ status: "ACTIVE" })
            .populate("advertiserUserId", "name email phone")
            .populate("listingId", "title images")
            .lean();
        const data = placements.map((p) => {
            const bookedCampaigns = activeCampaigns.filter((c) => c.placementIds?.includes(p.placementId));
            return {
                id: p._id.toString(),
                placementId: p.placementId,
                name: p.name,
                campaignTypes: p.campaignTypes,
                aspectRatio: p.aspectRatio,
                minimumWidth: p.minimumWidth,
                minimumHeight: p.minimumHeight,
                maximumFileSizeBytes: p.maximumFileSizeBytes,
                maximumActiveSlots: p.maximumActiveSlots,
                bookedSlotsCount: bookedCampaigns.length,
                bookedCampaigns: bookedCampaigns.map((c) => ({
                    campaignId: c._id.toString(),
                    advertiserName: c.advertiserUserId?.name || c.advertiserUserId?.email || "Seller Account",
                    listingTitle: c.listingId?.title || "Product Listing",
                    listingImage: c.listingId?.images?.[0] || "",
                    startAt: c.startAt,
                    endAt: c.endAt
                }))
            };
        });
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        Next(error);
    }
}
async function createAdPlacement(req, res, Next) {
    try {
        const { placementId, name, campaignTypes, aspectRatio, minimumWidth, minimumHeight, maximumFileSizeBytes, maximumActiveSlots } = req.body;
        if (!placementId || !name) {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "placementId and name are required" } });
            return;
        }
        const newPlacement = await AdPlacement_1.AdPlacement.create({
            placementId: placementId.toUpperCase(),
            name,
            campaignTypes: campaignTypes || ["BANNER_AD"],
            aspectRatio: aspectRatio || "16:9",
            minimumWidth: Number(minimumWidth) || 1200,
            minimumHeight: Number(minimumHeight) || 600,
            maximumFileSizeBytes: Number(maximumFileSizeBytes) || 2097152,
            maximumActiveSlots: Number(maximumActiveSlots) || 5,
            active: true
        });
        res.status(201).json({ success: true, data: newPlacement });
    }
    catch (error) {
        Next(error);
    }
}
async function deleteAdPlacement(req, res, Next) {
    try {
        const { id } = req.params;
        await AdPlacement_1.AdPlacement.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Placement slot deleted successfully" });
    }
    catch (error) {
        Next(error);
    }
}
async function createAdCampaign(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        let { listingId, adProductId, placementIds, creativeAssetId, bannerUrl, targeting } = req.body;
        if (!listingId || !adProductId) {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "listingId and adProductId are required" } });
            return;
        }
        let listing = null;
        if (mongoose_1.default.Types.ObjectId.isValid(listingId)) {
            listing = await Listing_1.Listing.findById(listingId);
        }
        else {
            listing = await Listing_1.Listing.findOne({ $or: [{ id: listingId }, { sellerId: req.user._id }] });
        }
        if (!listing) {
            listing = await Listing_1.Listing.findOne({ sellerId: req.user._id });
        }
        if (!listing) {
            listing = await Listing_1.Listing.create({
                sellerId: req.user._id,
                title: "Store Promotion Listing",
                description: "Promotional listing created for ad campaign",
                priceInPaise: 100000,
                categoryId: "general",
                city: "Hyderabad",
                status: "ACTIVE"
            });
        }
        let product = null;
        if (mongoose_1.default.Types.ObjectId.isValid(adProductId)) {
            product = await AdProduct_1.AdProduct.findById(adProductId);
        }
        else {
            product = await AdProduct_1.AdProduct.findOne({ active: true });
        }
        if (!product) {
            product = await AdProduct_1.AdProduct.create({
                name: "Standard Listing Boost (7 Days)",
                description: "Promote your listing card to top search positions",
                campaignType: "LISTING_BOOST",
                durationDays: 7,
                priceInPaise: 19900,
                permittedPlacements: ["SEARCH_TOP", "HOMEPAGE_CAROUSEL"],
                active: true
            });
        }
        const amountInPaise = product.priceInPaise;
        const taxInPaise = Math.round(amountInPaise * 0.18); // 18% GST
        const totalInPaise = amountInPaise + taxInPaise;
        const campaign = await AdCampaign_1.AdCampaign.create({
            campaignType: product.campaignType,
            advertiserUserId: req.user._id,
            targetType: "LISTING",
            listingId: listing._id,
            adProductId: product._id,
            placementIds: placementIds || product.permittedPlacements,
            creativeAssetId,
            bannerUrl: bannerUrl || (listing.images?.[0] || undefined),
            targeting: targeting || { categoryIds: [listing.categoryId] },
            pricing: {
                amountInPaise,
                taxInPaise,
                totalInPaise
            },
            paymentStatus: "NOT_STARTED",
            status: "DRAFT"
        });
        res.status(201).json({
            success: true,
            data: {
                id: campaign._id.toString(),
                campaignType: campaign.campaignType,
                status: campaign.status,
                pricing: campaign.pricing
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function submitAdCampaign(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { campaignId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(campaignId)) {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid campaign ID format" } });
            return;
        }
        const campaign = await AdCampaign_1.AdCampaign.findOne({ _id: campaignId, advertiserUserId: req.user._id });
        if (!campaign) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
            return;
        }
        if (campaign.status !== "DRAFT" && campaign.status !== "PAYMENT_PENDING") {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: `Campaign cannot be submitted in status ${campaign.status}` } });
            return;
        }
        let wallet = await Wallet_1.Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet_1.Wallet.create({ userId: req.user._id, balanceInPaise: 500000, refundBalanceInPaise: 0 });
        }
        const existingHolds = await WalletHold_1.WalletHold.find({ userId: req.user._id, status: "HELD" });
        const totalHeld = existingHolds.reduce((s, h) => s + h.amountInPaise, 0);
        const availableBalance = wallet.balanceInPaise - totalHeld;
        if (availableBalance < campaign.pricing.totalInPaise) {
            res.status(400).json({
                success: false,
                error: {
                    code: "INSUFFICIENT_FUNDS",
                    message: `Insufficient wallet balance. Required: ₹${(campaign.pricing.totalInPaise / 100).toLocaleString("en-IN")}, Available: ₹${(availableBalance / 100).toLocaleString("en-IN")}`
                }
            });
            return;
        }
        // Reserve Wallet Hold
        const hold = await WalletHold_1.WalletHold.create({
            userId: req.user._id,
            campaignId: campaign._id,
            amountInPaise: campaign.pricing.totalInPaise,
            status: "HELD",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        campaign.paymentStatus = "FUNDS_HELD";
        campaign.status = "PENDING_REVIEW";
        campaign.reviewDeadlineAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour review SLA
        await campaign.save();
        res.status(200).json({
            success: true,
            data: {
                id: campaign._id.toString(),
                status: campaign.status,
                reviewDeadlineAt: campaign.reviewDeadlineAt,
                holdId: hold._id.toString()
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyAdCampaigns(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const campaigns = await AdCampaign_1.AdCampaign.find({ advertiserUserId: req.user._id })
            .populate("listingId", "title priceInPaise images")
            .populate("adProductId", "name durationDays")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: campaigns.map((c) => ({
                id: c._id.toString(),
                campaignType: c.campaignType,
                listing: c.listingId
                    ? {
                        id: c.listingId._id.toString(),
                        title: c.listingId.title,
                        priceInPaise: c.listingId.priceInPaise,
                        image: c.listingId.images?.[0]
                    }
                    : undefined,
                productName: c.adProductId?.name,
                placementIds: c.placementIds,
                bannerUrl: c.bannerUrl,
                pricing: c.pricing,
                paymentStatus: c.paymentStatus,
                status: c.status,
                reviewDeadlineAt: c.reviewDeadlineAt,
                rejectionReason: c.rejectionReason,
                startAt: c.startAt,
                endAt: c.endAt,
                impressionsCount: c.impressionsCount,
                clicksCount: c.clicksCount,
                createdAt: c.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
// ── Admin Moderation Endpoints ──
async function getAdminAdCampaigns(req, res, next) {
    try {
        const { status, campaignType } = req.query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        else {
            filter.status = { $in: ["PENDING_REVIEW", "SUBMITTED", "ACTIVE", "APPROVED", "REJECTED"] };
        }
        if (campaignType) {
            filter.campaignType = campaignType;
        }
        const campaigns = await AdCampaign_1.AdCampaign.find(filter)
            .populate("advertiserUserId", "profile.name email phone")
            .populate("listingId", "title priceInPaise images status categoryId")
            .populate("adProductId", "name durationDays")
            .sort({ reviewDeadlineAt: 1, createdAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: campaigns.map((c) => ({
                id: c._id.toString(),
                campaignType: c.campaignType,
                advertiser: c.advertiserUserId
                    ? {
                        id: c.advertiserUserId._id.toString(),
                        name: c.advertiserUserId.profile?.name || c.advertiserUserId.email,
                        email: c.advertiserUserId.email,
                        phone: c.advertiserUserId.phone
                    }
                    : undefined,
                listing: c.listingId
                    ? {
                        id: c.listingId._id.toString(),
                        title: c.listingId.title,
                        priceInPaise: c.listingId.priceInPaise,
                        image: c.listingId.images?.[0]
                    }
                    : undefined,
                productName: c.adProductId?.name,
                durationDays: c.adProductId?.durationDays || 7,
                placementIds: c.placementIds,
                bannerUrl: c.bannerUrl,
                pricing: c.pricing,
                paymentStatus: c.paymentStatus,
                status: c.status,
                reviewDeadlineAt: c.reviewDeadlineAt,
                rejectionReason: c.rejectionReason,
                startAt: c.startAt,
                endAt: c.endAt,
                createdAt: c.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
async function approveAdminAdCampaign(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { campaignId } = req.params;
        const campaign = await AdCampaign_1.AdCampaign.findById(campaignId).populate("adProductId");
        if (!campaign) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
            return;
        }
        // Capture Wallet Hold
        const hold = await WalletHold_1.WalletHold.findOne({ campaignId: campaign._id, status: "HELD" });
        if (hold) {
            hold.status = "CAPTURED";
            hold.capturedAt = new Date();
            await hold.save();
            const wallet = await Wallet_1.Wallet.findOne({ userId: campaign.advertiserUserId });
            if (wallet) {
                wallet.balanceInPaise -= hold.amountInPaise;
                await wallet.save();
                await WalletTransaction_1.WalletTransaction.create({
                    walletId: wallet._id,
                    type: "debit",
                    amountInPaise: hold.amountInPaise,
                    description: `Boost Ad Campaign Activation (#${campaign._id.toString().slice(-6)})`,
                    referenceType: "promotion",
                    referenceId: campaign._id.toString(),
                    status: "SUCCESS"
                });
            }
        }
        const durationDays = campaign.adProductId?.durationDays || 7;
        const now = new Date();
        campaign.status = "ACTIVE";
        campaign.paymentStatus = "PAID";
        campaign.reviewedAt = now;
        campaign.reviewedByAdminId = req.admin._id;
        campaign.startAt = now;
        campaign.endAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        await campaign.save();
        res.status(200).json({
            success: true,
            data: {
                id: campaign._id.toString(),
                status: campaign.status,
                startAt: campaign.startAt,
                endAt: campaign.endAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function rejectAdminAdCampaign(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { campaignId } = req.params;
        const { rejectionReason } = req.body;
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Rejection reason is required" } });
            return;
        }
        const campaign = await AdCampaign_1.AdCampaign.findById(campaignId);
        if (!campaign) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
            return;
        }
        // Release Reserved Wallet Hold
        const hold = await WalletHold_1.WalletHold.findOne({ campaignId: campaign._id, status: "HELD" });
        if (hold) {
            hold.status = "RELEASED";
            hold.releasedAt = new Date();
            await hold.save();
        }
        campaign.status = "REJECTED";
        campaign.paymentStatus = "REFUNDED";
        campaign.rejectionReason = rejectionReason;
        campaign.reviewedAt = new Date();
        campaign.reviewedByAdminId = req.admin._id;
        await campaign.save();
        res.status(200).json({
            success: true,
            data: {
                id: campaign._id.toString(),
                status: campaign.status,
                rejectionReason: campaign.rejectionReason
            }
        });
    }
    catch (error) {
        next(error);
    }
}
// ── Live Ad Serving Engine ──
async function serveAds(req, res, next) {
    try {
        const { placement, categoryId } = req.query;
        const now = new Date();
        const query = {
            status: "ACTIVE",
            startAt: { $lte: now },
            endAt: { $gte: now }
        };
        if (placement) {
            query.placementIds = placement;
        }
        const activeCampaigns = await AdCampaign_1.AdCampaign.find(query)
            .populate("listingId", "title priceInPaise images city categoryId condition storeId")
            .populate("storeId", "name cover logo area")
            .limit(10)
            .lean();
        const servedAds = activeCampaigns.map((c) => {
            const isStoreAd = Boolean(placement === "STORE_BANNER" ||
                c.campaignType === "STORE_PROMOTION" ||
                c.placementIds?.includes("STORE_BANNER") ||
                c.storeId);
            const storeIdFromListing = c.listingId?.storeId?._id
                ? c.listingId.storeId._id.toString()
                : c.listingId?.storeId
                    ? String(c.listingId.storeId)
                    : undefined;
            const targetStoreId = c.storeId?._id
                ? c.storeId._id.toString()
                : c.storeId
                    ? String(c.storeId)
                    : storeIdFromListing;
            const targetListingId = c.listingId?._id
                ? c.listingId._id.toString()
                : c.listingId
                    ? String(c.listingId)
                    : undefined;
            let destinationUrl = "/";
            if (isStoreAd) {
                // If ad is about a Store -> Navigate to Store page!
                if (targetStoreId) {
                    destinationUrl = `/store/${targetStoreId}`;
                }
                else if (targetListingId) {
                    destinationUrl = `/store/${targetListingId}`;
                }
                else {
                    destinationUrl = "/stores";
                }
            }
            else if (targetListingId) {
                // Product Listing Boost -> Navigate to Product Details page!
                destinationUrl = `/product/${targetListingId}`;
            }
            else if (targetStoreId) {
                destinationUrl = `/store/${targetStoreId}`;
            }
            return {
                servedAdId: `served_${c._id.toString()}_${Date.now()}`,
                campaignId: c._id.toString(),
                campaignType: c.campaignType,
                listingId: targetListingId,
                storeId: targetStoreId,
                placement: placement || c.placementIds?.[0] || "HOMEPAGE_HERO",
                creative: {
                    imageUrl: c.bannerUrl || c.listingId?.images?.[0] || c.storeId?.cover,
                    title: c.listingId?.title || c.storeId?.name || "Sponsored Highlight",
                    priceInPaise: c.listingId?.priceInPaise,
                    destinationUrl
                },
                label: "Sponsored"
            };
        });
        if (servedAds.length === 0) {
            const targetPlacement = String(placement || "HOMEPAGE_HERO");
            const defaultAdsMap = {
                HOMEPAGE_HERO: {
                    servedAdId: `default_hero_${Date.now()}`,
                    campaignId: "default_hero_campaign",
                    campaignType: "BANNER_AD",
                    placement: "HOMEPAGE_HERO",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200",
                        title: "Boost Your Products & Reach Nearby Buyers on Omeetso!",
                        priceInPaise: 0,
                        destinationUrl: "/promotions/new"
                    },
                    label: "Platform Highlight"
                },
                CATEGORY_HEADER: {
                    servedAdId: `default_cat_${Date.now()}`,
                    campaignId: "default_cat_campaign",
                    campaignType: "BANNER_AD",
                    placement: "CATEGORY_HEADER",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
                        title: "Featured Category Banner — Sell Fast Near You!",
                        priceInPaise: 0,
                        destinationUrl: "/sell/quick"
                    },
                    label: "Platform Highlight"
                },
                SEARCH_TOP: {
                    servedAdId: `default_search_${Date.now()}`,
                    campaignId: "default_search_campaign",
                    campaignType: "LISTING_BOOST",
                    placement: "SEARCH_TOP",
                    listingId: "p_1",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
                        title: "Smart Watch Series 9 — Omeetso Priority Listing",
                        priceInPaise: 1499900,
                        destinationUrl: "/product/p_1"
                    },
                    label: "Platform Highlight"
                },
                HOMEPAGE_CAROUSEL: {
                    servedAdId: `default_carousel_${Date.now()}`,
                    campaignId: "default_carousel_campaign",
                    campaignType: "LISTING_BOOST",
                    placement: "HOMEPAGE_CAROUSEL",
                    listingId: "p_2",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
                        title: "Noise-Cancelling Headphones Pro",
                        priceInPaise: 899900,
                        destinationUrl: "/product/p_2"
                    },
                    label: "Platform Highlight"
                },
                URGENT_BADGE: {
                    servedAdId: `default_urgent_${Date.now()}`,
                    campaignId: "default_urgent_campaign",
                    campaignType: "LISTING_BOOST",
                    placement: "URGENT_BADGE",
                    listingId: "p_3",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
                        title: "Nike Air Max Sports Shoes",
                        priceInPaise: 499900,
                        destinationUrl: "/product/p_3"
                    },
                    label: "Urgent Deal"
                },
                STORE_BANNER: {
                    servedAdId: `default_store_${Date.now()}`,
                    campaignId: "default_store_campaign",
                    campaignType: "BANNER_AD",
                    placement: "STORE_BANNER",
                    creative: {
                        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
                        title: "Verified Local Tech Store — Visit Showcase!",
                        priceInPaise: 0,
                        destinationUrl: "/stores"
                    },
                    label: "Store Spotlight"
                }
            };
            const fallback = defaultAdsMap[targetPlacement] || defaultAdsMap["HOMEPAGE_HERO"];
            servedAds.push(fallback);
        }
        res.status(200).json({
            success: true,
            data: servedAds
        });
    }
    catch (error) {
        next(error);
    }
}
async function trackAdImpression(req, res, next) {
    try {
        const { campaignId, placementId } = req.body;
        if (!campaignId || campaignId.startsWith("default_")) {
            res.status(200).json({ success: true, tracked: false });
            return;
        }
        const dateStr = new Date().toISOString().split("T")[0];
        // Increment overall campaign impressions
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(campaignId, { $inc: { impressionsCount: 1 } });
        // Update daily time-series analytics
        const analytics = await AdAnalytics_1.AdAnalytics.findOneAndUpdate({ campaignId, placementId: placementId || "GENERAL", date: dateStr }, { $inc: { impressions: 1 } }, { upsert: true, new: true });
        if (analytics) {
            analytics.ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions) * 100 : 0;
            await analytics.save();
        }
        res.status(200).json({ success: true, tracked: true });
    }
    catch (error) {
        next(error);
    }
}
async function trackAdClick(req, res, next) {
    try {
        const { campaignId, placementId } = req.body;
        if (!campaignId || campaignId.startsWith("default_")) {
            res.status(200).json({ success: true, tracked: false });
            return;
        }
        const dateStr = new Date().toISOString().split("T")[0];
        // Increment overall campaign clicks
        await AdCampaign_1.AdCampaign.findByIdAndUpdate(campaignId, { $inc: { clicksCount: 1 } });
        // Update daily time-series analytics
        const analytics = await AdAnalytics_1.AdAnalytics.findOneAndUpdate({ campaignId, placementId: placementId || "GENERAL", date: dateStr }, { $inc: { clicks: 1 } }, { upsert: true, new: true });
        if (analytics) {
            analytics.ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions) * 100 : 0;
            await analytics.save();
        }
        res.status(200).json({ success: true, tracked: true });
    }
    catch (error) {
        next(error);
    }
}
async function getCampaignAnalytics(req, res, next) {
    try {
        const { id } = req.params;
        const campaign = await AdCampaign_1.AdCampaign.findById(id);
        if (!campaign) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
            return;
        }
        const series = await AdAnalytics_1.AdAnalytics.find({ campaignId: id }).sort({ date: 1 });
        const totalImpressions = campaign.impressionsCount || 0;
        const totalClicks = campaign.clicksCount || 0;
        const ctr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
        res.status(200).json({
            success: true,
            data: {
                campaignId: campaign._id,
                status: campaign.status,
                totalImpressions,
                totalClicks,
                ctr,
                dailySeries: series
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminRevenueAnalytics(req, res, next) {
    try {
        const campaigns = await AdCampaign_1.AdCampaign.find({ status: { $in: ["APPROVED", "ACTIVE", "COMPLETED"] } });
        let totalRevenueInPaise = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        campaigns.forEach(c => {
            totalRevenueInPaise += c.pricing?.totalInPaise || 0;
            totalImpressions += c.impressionsCount || 0;
            totalClicks += c.clicksCount || 0;
        });
        const averageCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
        res.status(200).json({
            success: true,
            data: {
                totalMonetizationRevenueInPaise: totalRevenueInPaise,
                totalActiveCampaigns: campaigns.length,
                totalImpressionsServed: totalImpressions,
                totalClicksRecorded: totalClicks,
                averageCtr
            }
        });
    }
    catch (error) {
        next(error);
    }
}
