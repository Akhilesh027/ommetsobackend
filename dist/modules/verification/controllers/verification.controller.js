"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitVerification = submitVerification;
exports.getMyVerifications = getMyVerifications;
exports.getAdminVerifications = getAdminVerifications;
exports.approveVerification = approveVerification;
const VerificationRequest_1 = require("../models/VerificationRequest");
const User_1 = require("../../users/models/User");
const AuditLog_1 = require("../../admin/models/AuditLog");
async function submitVerification(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { type, documentType, documentNumber, documentImages } = req.body;
        const request = await VerificationRequest_1.VerificationRequest.create({
            userId: req.user._id,
            type,
            documentType,
            documentNumber,
            documentImages: documentImages || [],
            status: "pending"
        });
        res.status(201).json({
            success: true,
            data: {
                id: request._id.toString(),
                type: request.type,
                status: request.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMyVerifications(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const requests = await VerificationRequest_1.VerificationRequest.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: {
                summary: req.user.verificationSummary,
                requests: requests.map((r) => ({
                    id: r._id.toString(),
                    type: r.type,
                    documentType: r.documentType,
                    status: r.status,
                    rejectionReason: r.rejectionReason,
                    createdAt: r.createdAt
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminVerifications(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status)
            query.status = req.query.status;
        const [requests, total] = await Promise.all([
            VerificationRequest_1.VerificationRequest.find(query)
                .populate("userId", "profile.name email phone")
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            VerificationRequest_1.VerificationRequest.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            data: requests.map((r) => ({
                id: r._id.toString(),
                type: r.type,
                documentType: r.documentType,
                documentNumber: r.documentNumber,
                documentImages: r.documentImages,
                status: r.status,
                createdAt: r.createdAt,
                user: r.userId
                    ? {
                        id: r.userId._id.toString(),
                        name: r.userId.profile?.name,
                        phone: r.userId.phone,
                        email: r.userId.email
                    }
                    : undefined
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
async function approveVerification(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { requestId } = req.params;
        const request = await VerificationRequest_1.VerificationRequest.findById(requestId);
        if (!request) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Verification request not found" } });
            return;
        }
        request.status = "approved";
        request.assignedAdminId = req.admin._id;
        request.verifiedAt = new Date();
        await request.save();
        // Update User verification summary
        const user = await User_1.User.findById(request.userId);
        if (user) {
            if (request.type === "identity")
                user.verificationSummary.identityVerified = true;
            if (request.type === "business")
                user.verificationSummary.businessVerified = true;
            if (request.type === "email")
                user.verificationSummary.emailVerified = true;
            await user.save();
        }
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: "VERIFICATION_APPROVE",
            targetType: "VerificationRequest",
            targetId: request._id.toString(),
            reason: "Document verified",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: request._id.toString(),
                status: request.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
