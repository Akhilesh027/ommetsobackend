"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackgroundWorkers = startBackgroundWorkers;
const MediaAsset_1 = require("../modules/uploads/models/MediaAsset");
const Listing_1 = require("../modules/listings/models/Listing");
const contracts_1 = require("@omeetso/contracts");
function startBackgroundWorkers() {
    console.log("[Worker] Background cleanup worker initialized (Interval: 1 hour)");
    // Run cleanup once on startup, then every hour
    runBackgroundTasks();
    setInterval(runBackgroundTasks, 60 * 60 * 1000);
}
async function runBackgroundTasks() {
    try {
        // 1. Cleanup unattached media assets older than 24 hours
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const mediaResult = await MediaAsset_1.MediaAsset.updateMany({ status: "unattached", createdAt: { $lt: cutoffDate } }, { $set: { status: "deleted" } });
        if (mediaResult.modifiedCount > 0) {
            console.log(`[Worker] Cleaned up ${mediaResult.modifiedCount} unattached media assets.`);
        }
        // 2. Automatically mark expired listings
        const listingResult = await Listing_1.Listing.updateMany({ status: { $in: [contracts_1.ListingStatus.APPROVED, contracts_1.ListingStatus.ACTIVE] }, expiresAt: { $lt: new Date() } }, { $set: { status: contracts_1.ListingStatus.EXPIRED } });
        if (listingResult.modifiedCount > 0) {
            console.log(`[Worker] Expired ${listingResult.modifiedCount} listings.`);
        }
    }
    catch (error) {
        console.error("[Worker] Background task error:", error);
    }
}
