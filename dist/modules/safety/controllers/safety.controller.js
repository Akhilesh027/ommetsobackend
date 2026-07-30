"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSafetyReport = createSafetyReport;
exports.getAdminSafetyReports = getAdminSafetyReports;
exports.resolveSafetyReport = resolveSafetyReport;
const SafetyReport_1 = require("../models/SafetyReport");
const AuditLog_1 = require("../../admin/models/AuditLog");
const contracts_1 = require("@omeetso/contracts");
async function createSafetyReport(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { targetType, targetId, category, description, evidenceImages, priority } = req.body;
        const report = await SafetyReport_1.SafetyReport.create({
            reporterId: req.user._id,
            targetType,
            targetId,
            category,
            description,
            evidenceImages: evidenceImages || [],
            priority: priority || contracts_1.SafetyPriority.MEDIUM,
            status: "OPEN"
        });
        res.status(201).json({
            success: true,
            data: {
                id: report._id.toString(),
                status: report.status,
                createdAt: report.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAdminSafetyReports(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status)
            query.status = req.query.status;
        const [reports, total] = await Promise.all([
            SafetyReport_1.SafetyReport.find(query)
                .populate("reporterId", "profile.name phone email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SafetyReport_1.SafetyReport.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            data: reports.map((r) => ({
                id: r._id.toString(),
                targetType: r.targetType,
                targetId: r.targetId,
                category: r.category,
                description: r.description,
                evidenceImages: r.evidenceImages,
                priority: r.priority,
                status: r.status,
                createdAt: r.createdAt,
                reporter: r.reporterId
                    ? {
                        id: r.reporterId._id.toString(),
                        name: r.reporterId.profile?.name,
                        phone: r.reporterId.phone
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
async function resolveSafetyReport(req, res, next) {
    try {
        if (!req.admin) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
            return;
        }
        const { reportId } = req.params;
        const { action, resolutionNotes } = req.body;
        const report = await SafetyReport_1.SafetyReport.findById(reportId);
        if (!report) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Safety report not found" } });
            return;
        }
        report.status = action === "dismiss" ? "DISMISSED" : "RESOLVED";
        report.assignedAdminId = req.admin._id;
        report.assignedAdminName = req.admin.name;
        report.resolutionNotes = resolutionNotes;
        await report.save();
        await AuditLog_1.AuditLog.create({
            actorAdminId: req.admin._id,
            actorName: req.admin.name,
            actorRole: req.admin.role,
            action: `SAFETY_REPORT_${report.status}`,
            targetType: "SafetyReport",
            targetId: report._id.toString(),
            reason: resolutionNotes || "Safety report investigation completed",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(200).json({
            success: true,
            data: {
                id: report._id.toString(),
                status: report.status
            }
        });
    }
    catch (error) {
        next(error);
    }
}
