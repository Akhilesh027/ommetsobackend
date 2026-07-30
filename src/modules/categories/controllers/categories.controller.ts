import { Request, Response, NextFunction } from "express";
import { Category } from "../models/Category";

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await Category.find({ isActive: true })
      .select("categoryId name row iconName subcategories filters sortOptions")
      .sort({ row: 1, name: 1 })
      .lean();

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.status(200).json({
      success: true,
      data: categories.map((cat) => ({
        id: cat.categoryId,
        categoryId: cat.categoryId,
        name: cat.name,
        row: cat.row,
        iconName: cat.iconName,
        subcategories: cat.subcategories,
        filters: cat.filters,
        sortOptions: cat.sortOptions
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoryId } = req.params;
    const category = await Category.findOne({ categoryId, isActive: true }).lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: `Category "${categoryId}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryFormSchema(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoryId } = req.params;
    const category = await Category.findOne({ categoryId, isActive: true })
      .select("categoryId name subcategories sellingFormFields detailsSpecFields specFields")
      .lean();

    if (!category) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: `Category "${categoryId}" not found` }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        categoryId: category.categoryId,
        name: category.name,
        subcategories: category.subcategories,
        sellingFormFields: category.sellingFormFields,
        detailsSpecFields: category.detailsSpecFields,
        specFields: category.specFields || []
      }
    });
  } catch (error) {
    next(error);
  }
}
