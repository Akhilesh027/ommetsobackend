import { Response, NextFunction } from "express";
import { Store } from "../../stores/models/Store";
import { AuditLog } from "../models/AuditLog";
import { AuthenticatedAdminRequest } from "../../../middleware/authenticateAdmin";
import { StoreStatus } from "../../../contracts";

export async function getAdminStores(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    // No default status filter — admin sees ALL stores

    const [stores, total] = await Promise.all([
      Store.find(query)
        .populate("ownerId", "profile.name phone email")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Store.countDocuments(query)
    ]);

    const items = stores.map((s: any) => ({
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
  } catch (error) {
    next(error);
  }
}

export async function approveStore(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
      return;
    }

    const { storeId } = req.params;
    const store = await Store.findById(storeId);

    if (!store) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
      return;
    }

    const beforeState = { status: store.status };
    store.status = StoreStatus.APPROVED;
    store.publishedAt = new Date();
    await store.save();

    await AuditLog.create({
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
  } catch (error) {
    next(error);
  }
}

export async function rejectStore(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
      return;
    }

    const { storeId } = req.params;
    const { reason } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Store not found" } });
      return;
    }

    const beforeState = { status: store.status };
    store.status = StoreStatus.REJECTED;
    await store.save();

    await AuditLog.create({
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
  } catch (error) {
    next(error);
  }
}
