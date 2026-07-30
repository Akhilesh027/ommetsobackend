"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdConfiguration = seedAdConfiguration;
const AdProduct_1 = require("../../modules/revenue/models/AdProduct");
const AdPlacement_1 = require("../../modules/revenue/models/AdPlacement");
const AdCampaign_1 = require("../../modules/revenue/models/AdCampaign");
const Listing_1 = require("../../modules/listings/models/Listing");
const User_1 = require("../../modules/users/models/User");
const mongoose_1 = __importDefault(require("mongoose"));
async function seedAdConfiguration() {
    try {
        const placements = [
            {
                placementId: "HOMEPAGE_HERO",
                name: "Homepage Hero Banner",
                campaignTypes: ["BANNER_AD"],
                aspectRatio: "16:9",
                minimumWidth: 1600,
                minimumHeight: 900,
                maximumFileSizeBytes: 3145728, // 3MB
                maximumActiveSlots: 5,
                active: true
            },
            {
                placementId: "CATEGORY_HEADER",
                name: "Category Header Banner",
                campaignTypes: ["BANNER_AD"],
                aspectRatio: "3:1",
                minimumWidth: 1500,
                minimumHeight: 500,
                maximumFileSizeBytes: 2097152, // 2MB
                maximumActiveSlots: 3,
                active: true
            },
            {
                placementId: "SEARCH_TOP",
                name: "Search Priority #1 Spot",
                campaignTypes: ["LISTING_BOOST"],
                aspectRatio: "CARD",
                minimumWidth: 400,
                minimumHeight: 400,
                maximumFileSizeBytes: 1048576,
                maximumActiveSlots: 10,
                active: true
            },
            {
                placementId: "HOMEPAGE_CAROUSEL",
                name: "Featured Deals Carousel",
                campaignTypes: ["LISTING_BOOST"],
                aspectRatio: "CARD",
                minimumWidth: 400,
                minimumHeight: 400,
                maximumFileSizeBytes: 1048576,
                maximumActiveSlots: 10,
                active: true
            },
            {
                placementId: "URGENT_BADGE",
                name: "Urgent Deal Highlight",
                campaignTypes: ["LISTING_BOOST"],
                aspectRatio: "BADGE",
                minimumWidth: 200,
                minimumHeight: 200,
                maximumFileSizeBytes: 524288,
                maximumActiveSlots: 15,
                active: true
            },
            {
                placementId: "STORE_BANNER",
                name: "Store Directory Spotlight",
                campaignTypes: ["BANNER_AD"],
                aspectRatio: "3:1",
                minimumWidth: 1200,
                minimumHeight: 400,
                maximumFileSizeBytes: 2097152,
                maximumActiveSlots: 5,
                active: true
            }
        ];
        for (const p of placements) {
            await AdPlacement_1.AdPlacement.findOneAndUpdate({ placementId: p.placementId }, { $set: p }, { upsert: true, new: true });
        }
        console.log("[Seeder] Synced 6 AdPlacement slots in MongoDB.");
        const products = [
            {
                name: "7-Day Search Priority Boost",
                description: "Promote your listing card to top search positions with a SPONSORED badge.",
                campaignType: "LISTING_BOOST",
                durationDays: 7,
                priceInPaise: 19900, // ₹199
                permittedPlacements: ["SEARCH_TOP", "HOMEPAGE_CAROUSEL"],
                active: true
            },
            {
                name: "14-Day Urgent Seller Spotlight",
                description: "High-visibility red URGENT tag and top category priority for 14 days.",
                campaignType: "LISTING_BOOST",
                durationDays: 14,
                priceInPaise: 39900, // ₹399
                permittedPlacements: ["SEARCH_TOP", "URGENT_BADGE", "CATEGORY_HEADER"],
                active: true
            },
            {
                name: "7-Day Homepage Hero Banner",
                description: "Custom promotional banner featured on Omeetso Homepage Hero Carousel.",
                campaignType: "BANNER_AD",
                durationDays: 7,
                priceInPaise: 49900, // ₹499
                permittedPlacements: ["HOMEPAGE_HERO"],
                active: true
            },
            {
                name: "30-Day Store Mega Takeover",
                description: "Full homepage hero + category top header banners with premium store spotlight.",
                campaignType: "BANNER_AD",
                durationDays: 30,
                priceInPaise: 99900, // ₹999
                permittedPlacements: ["HOMEPAGE_HERO", "CATEGORY_HEADER", "STORE_BANNER"],
                active: true
            }
        ];
        for (const prod of products) {
            await AdProduct_1.AdProduct.findOneAndUpdate({ name: prod.name }, { $set: prod }, { upsert: true, new: true });
        }
        console.log("[Seeder] Synced AdProduct pricing packages in MongoDB.");
        // Ensure a seed seller account exists
        let seller = await User_1.User.findOne({ role: "SELLER" });
        if (!seller) {
            seller = await User_1.User.findOne({ email: "admin@omeetso.com" });
        }
        const sellerId = seller ? seller._id : new mongoose_1.default.Types.ObjectId();
        // Create sample MongoDB listings if none exist
        let sampleListing = await Listing_1.Listing.findOne({});
        if (!sampleListing) {
            sampleListing = await Listing_1.Listing.create({
                sellerId,
                title: "Apple Watch Series 9 GPS 45mm Aluminum",
                description: "Brand new unopened Apple Watch Series 9 in midnight aluminum finish with sport band.",
                priceInPaise: 3499900,
                categoryId: "electronics",
                city: "Hyderabad",
                images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
                status: "ACTIVE"
            });
        }
        // Seed Active Ad Campaigns for ALL 6 Placement Slots
        const now = new Date();
        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const activeSampleCampaigns = [
            {
                campaignType: "BANNER_AD",
                advertiserUserId: sellerId,
                targetType: "LISTING",
                listingId: sampleListing._id,
                placementIds: ["HOMEPAGE_HERO"],
                bannerUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600",
                pricing: { amountInPaise: 49900, taxInPaise: 8982, totalInPaise: 58882 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            },
            {
                campaignType: "BANNER_AD",
                advertiserUserId: sellerId,
                targetType: "LISTING",
                listingId: sampleListing._id,
                placementIds: ["CATEGORY_HEADER"],
                bannerUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1500",
                pricing: { amountInPaise: 39900, taxInPaise: 7182, totalInPaise: 47082 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            },
            {
                campaignType: "LISTING_BOOST",
                advertiserUserId: sellerId,
                targetType: "LISTING",
                listingId: sampleListing._id,
                placementIds: ["SEARCH_TOP"],
                pricing: { amountInPaise: 19900, taxInPaise: 3582, totalInPaise: 23482 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            },
            {
                campaignType: "LISTING_BOOST",
                advertiserUserId: sellerId,
                targetType: "LISTING",
                listingId: sampleListing._id,
                placementIds: ["HOMEPAGE_CAROUSEL"],
                pricing: { amountInPaise: 19900, taxInPaise: 3582, totalInPaise: 23482 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            },
            {
                campaignType: "LISTING_BOOST",
                advertiserUserId: sellerId,
                targetType: "LISTING",
                listingId: sampleListing._id,
                placementIds: ["URGENT_BADGE"],
                pricing: { amountInPaise: 14900, taxInPaise: 2682, totalInPaise: 17582 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            },
            {
                campaignType: "BANNER_AD",
                advertiserUserId: sellerId,
                targetType: "STORE",
                listingId: sampleListing._id,
                placementIds: ["STORE_BANNER"],
                bannerUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
                pricing: { amountInPaise: 29900, taxInPaise: 5382, totalInPaise: 35282 },
                paymentStatus: "PAID",
                status: "ACTIVE",
                startAt: now,
                endAt: future
            }
        ];
        for (const c of activeSampleCampaigns) {
            await AdCampaign_1.AdCampaign.findOneAndUpdate({ advertiserUserId: c.advertiserUserId, placementIds: c.placementIds }, { $set: c }, { upsert: true, new: true });
        }
        console.log("[Seeder] Synced active booked campaigns for all 6 placement slots in MongoDB.");
    }
    catch (error) {
        console.error("[Seeder] Error seeding ad configuration:", error);
    }
}
