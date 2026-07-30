"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStores = getAdminStores;
exports.approveStore = approveStore;
exports.rejectStore = rejectStore;
const Store_1 = require("../../stores/models/Store");
const AuditLog_1 = require("../models/AuditLog");
const contracts_1 = require("@omeetso/contracts");
async function getAdminStores(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        else {
            query.status = { $in: [contracts_1.StoreStatus.SUBMITTED, contracts_1.StoreStatus.UNDER_REVIEW] };
        }
        const [stores, total] = await Promise.all([
            Store_1.Store.find(query)
                .populate("ownerId", "profile.name phone email")
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Store_1.Store.countDocuments(query)
        ]);
        const items = stores.map((s) => ({
            id: s._id.toString(),
            name: s.name,
            slug: s.slug,
            businessType: s.businessType,
            primaryCategory: s.primaryCategory,
            area: s.area,
            city: s.city,
            status: s.status,
            createdAt: s.createdAt,
            owner: s.ownerId
                ? {
                    id: s.ownerId._id.toString(),
                    name: s.ownerId.profile?.name,
                    phone: s.ownerId.phone,
                    email: s.ownerId.email
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
async function approveStore(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { storeId } = req.params;
        const store = await Store_1.Store.findById(storeId);
        if (!store) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
            return;
        }
        const beforeState = { status: store.status };
        store.status = contracts_1.StoreStatus.APPROVED;
        store.publishedAt = new Date();
        await store.save();
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: "STORE_APPROVE",
            targetType: "Store",
            targetId: store._id.toString(),
            reason: req.body.reason || "Store business details verified",
            before: beforeState,
            after: { status: store.status },
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: store._id.toString(),
                name: store.name,
                status: store.status,
                publishedAt: store.publishedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function rejectStore(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { storeId } = req.params;
        const { reason } = req.body;
        const store = await Store_1.Store.findById(storeId);
        if (!store) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
            return;
        }
        const beforeState = { status: store.status };
        store.status = contracts_1.StoreStatus.REJECTED;
        await store.save();
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: "STORE_REJECT",
            targetType: "Store",
            targetId: store._id.toString(),
            reason: reason || "Store details incomplete or invalid",
            before: beforeState,
            after: { status: store.status },
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: store._id.toString(),
                status: store.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
