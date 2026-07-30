import { Router } from "express";
import {
  getAdminListings,
  approveListing,
  rejectListing
} from "../controllers/adminListings.controller";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const adminListingsRouter = Router();

adminListingsRouter.get("/", authenticateAdmin, requirePermission("listings.view"), getAdminListings);
adminListingsRouter.patch("/:listingId/approve", authenticateAdmin, requirePermission("listings.approve"), approveListing);
adminListingsRouter.patch("/:listingId/reject", authenticateAdmin, requirePermission("listings.reject"), rejectListing);
