import { Router } from "express";
import { signUpload, completeUpload, deleteUpload, directUpload } from "../controllers/uploads.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";

export const uploadsRouter = Router();

uploadsRouter.post("/direct", authenticateUser, directUpload);
uploadsRouter.post("/sign", authenticateUser, signUpload);
uploadsRouter.post("/complete", authenticateUser, completeUpload);
uploadsRouter.delete("/:mediaId", authenticateUser, deleteUpload);
