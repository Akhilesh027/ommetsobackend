import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getSavedLocations,
  addSavedLocation,
  deleteSavedLocation,
  getPublicProfile,
  getAdminUsersList
} from "../controllers/users.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";

export const usersRouter = Router();

usersRouter.get("/admin/all", getAdminUsersList);

usersRouter.get("/me", authenticateUser, getMyProfile);
usersRouter.patch("/me", authenticateUser, updateMyProfile);
usersRouter.get("/me/locations", authenticateUser, getSavedLocations);
usersRouter.post("/me/locations", authenticateUser, addSavedLocation);
usersRouter.delete("/me/locations/:locationId", authenticateUser, deleteSavedLocation);
usersRouter.get("/:userId/public", getPublicProfile);
