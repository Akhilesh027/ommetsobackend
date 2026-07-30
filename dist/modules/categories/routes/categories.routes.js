"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRouter = void 0;
const express_1 = require("express");
const categories_controller_1 = require("../controllers/categories.controller");
exports.categoriesRouter = (0, express_1.Router)();
exports.categoriesRouter.get("/", categories_controller_1.getCategories);
exports.categoriesRouter.get("/:categoryId", categories_controller_1.getCategoryById);
exports.categoriesRouter.get("/:categoryId/form-schema", categories_controller_1.getCategoryFormSchema);
