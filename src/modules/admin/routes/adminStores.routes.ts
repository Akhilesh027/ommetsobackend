import { Router } from "express";
import {
  getAdminStores,
  approveStore,
  rejectStore
} from "../controllers/adminStores.controller";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const adminStoresRouter = Router();

adminStoresRouter.get("/", authenticateAdmin, requirePermission("stores.view"), getAdminStores);
adminStoresRouter.patch("/:storeId/approve", authenticateAdmin, requirePermission("stores.approve"), approveStore);
adminStoresRouter.patch("/:storeId/reject", authenticateAdmin, requirePermission("stores.reject"), rejectStore);
