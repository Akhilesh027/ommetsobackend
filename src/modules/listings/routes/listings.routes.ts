import { Router } from "express";
import {
  createListing,
  getPublicListings,
  getListingById,
  getMyListings,
  updateListing,
  markListingSold,
  recordListingView,
  recordListingSave
} from "../controllers/listings.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";
import { validateBody } from "../../../middleware/validateRequest";
import { CreateListingRequestSchema } from "@omeetso/contracts";

export const listingsRouter = Router();

listingsRouter.get("/", getPublicListings);
listingsRouter.get("/feed", getPublicListings);
listingsRouter.get("/user/me", authenticateUser, getMyListings);
listingsRouter.get("/:listingId", getListingById);

listingsRouter.post("/", authenticateUser, validateBody(CreateListingRequestSchema), createListing);
listingsRouter.patch("/:listingId", authenticateUser, updateListing);
listingsRouter.post("/:listingId/mark-sold", authenticateUser, markListingSold);
listingsRouter.post("/:listingId/view", recordListingView);
listingsRouter.post("/:listingId/save", recordListingSave);
