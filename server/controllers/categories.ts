import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";
import AppError from "../utils/AppError";

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true, isDeleted: false }).sort("name");
    res.status(200).json({ status: "success", data: { categories }, message: "Categories retrieved" });
  } catch (err) { next(err); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existing = await Category.findOne({ slug });
    if (existing) return next(new AppError("Category already exists.", 409));
    const category = await Category.create({ name, slug, icon: icon || "📦", description });
    res.status(201).json({ status: "success", data: { category }, message: "Category created" });
  } catch (err) { next(err); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found.", 404));
    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();
    res.status(200).json({ status: "success", data: null, message: "Category deleted" });
  } catch (err) { next(err); }
};
