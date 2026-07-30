import { Router } from "express";
import { getCategories, getCategoryById, getCategoryFormSchema } from "../controllers/categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", getCategories);
categoriesRouter.get("/:categoryId", getCategoryById);
categoriesRouter.get("/:categoryId/form-schema", getCategoryFormSchema);
