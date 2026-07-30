"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
exports.getLiveActivity = getLiveActivity;
exports.getAuditLogs = getAuditLogs;
const User_1 = require("../../users/models/User");
const Listing_1 = require("../../listings/models/Listing");
const Store_1 = require("../../stores/models/Store");
const SafetyReport_1 = require("../../safety/models/SafetyReport");
const SupportTicket_1 = require("../../support/models/SupportTicket");
const AuditLog_1 = require("../models/AuditLog");
const contracts_1 = require("@omeetso/contracts");
async function getDashboardSummary(req, res, next) {
    try {
        const [totalUsers, activeListings, pendingListings, pendingStores, openSafetyReports, openSupportTickets] = await Promise.all([
            User_1.User.countDocuments(),
            Listing_1.Listing.countDocuments({ status: { $in: [contracts_1.ListingStatus.APPROVED, contracts_1.ListingStatus.ACTIVE] } }),
            Listing_1.Listing.countDocuments({ status: { $in: [contracts_1.ListingStatus.SUBMITTED, contracts_1.ListingStatus.PENDING_REVIEW, contracts_1.ListingStatus.UNDER_REVIEW] } }),
            Store_1.Store.countDocuments({ status: { $in: [contracts_1.StoreStatus.SUBMITTED, contracts_1.StoreStatus.UNDER_REVIEW] } }),
            SafetyReport_1.SafetyReport.countDocuments({ status: { $in: ["OPEN", "INVESTIGATING"] } }),
            SupportTicket_1.SupportTicket.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS", "ESCALATED"] } })
        ]);
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeListings,
                pendingListings,
                pendingStores,
                openSafetyReports,
                openSupportTickets
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getLiveActivity(req, res, next) {
    try {
        const logs = await AuditLog_1.AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();
        res.status(200).json({
            success: true,
            data: logs.map((l) => ({
                id: l._id.toString(),
                adminName: l.actorName,
                adminRole: l.actorRole,
                action: l.action,
                targetType: l.targetType,
                targetId: l.targetId,
                reason: l.reason,
                timestamp: l.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAuditLogs(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.action)
            query.action = req.query.action;
        if (req.query.targetType)
            query.targetType = req.query.targetType;
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog_1.AuditLog.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            data: logs.map((l) => ({
                id: l._id.toString(),
                actorAdminId: l.actorAdminId.toString(),
                actorName: l.actorName,
                actorRole: l.actorRole,
                action: l.action,
                targetType: l.targetType,
                targetId: l.targetId,
                reason: l.reason,
                before: l.before,
                after: l.after,
                ipAddress: l.ipAddress,
                createdAt: l.createdAt
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
