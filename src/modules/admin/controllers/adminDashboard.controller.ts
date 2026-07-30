import { Response, NextFunction } from "express";
import { User } from "../../users/models/User";
import { Listing } from "../../listings/models/Listing";
import { Store } from "../../stores/models/Store";
import { SafetyReport } from "../../safety/models/SafetyReport";
import { SupportTicket } from "../../support/models/SupportTicket";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedAdminRequest } from "../../../middleware/authenticateAdmin";
import { ListingStatus, StoreStatus } from "../../../contracts";

export async function getDashboardSummary(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      activeListings,
      pendingListings,
      pendingStores,
      openSafetyReports,
      openSupportTickets
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ status: { $in: [ListingStatus.APPROVED, ListingStatus.ACTIVE] } }),
      Listing.countDocuments({ status: { $in: [ListingStatus.SUBMITTED, ListingStatus.PENDING_REVIEW, ListingStatus.UNDER_REVIEW] } }),
      Store.countDocuments({ status: { $in: [StoreStatus.SUBMITTED, StoreStatus.UNDER_REVIEW] } }),
      SafetyReport.countDocuments({ status: { $in: ["OPEN", "INVESTIGATING"] } }),
      SupportTicket.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS", "ESCALATED"] } })
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
  } catch (error) {
    next(error);
  }
}

export async function getLiveActivity(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await AuditLog.find()
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
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.targetType) query.targetType = req.query.targetType;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
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
  } catch (error) {
    next(error);
  }
}
