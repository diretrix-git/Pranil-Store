"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const redis_1 = require("../config/redis");
const getCategories = async (_req, res, next) => {
    try {
        const cached = await (0, redis_1.cacheGet)(redis_1.KEYS.categories);
        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.status(200).json(cached);
            return;
        }
        const categories = await Category_1.default.find({ isActive: true, isDeleted: false }).sort("name");
        const payload = { status: "success", data: { categories }, message: "Categories retrieved" };
        await (0, redis_1.cacheSet)(redis_1.KEYS.categories, payload, redis_1.TTL.CATEGORIES);
        res.setHeader("X-Cache", "MISS");
        res.status(200).json(payload);
    }
    catch (err) {
        next(err);
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res, next) => {
    try {
        const { name, icon, description } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const existing = await Category_1.default.findOne({ slug });
        if (existing)
            return next(new AppError_1.default("Category already exists.", 409));
        const category = await Category_1.default.create({ name, slug, icon: icon || "📦", description });
        await (0, redis_1.cacheDel)(redis_1.KEYS.categories);
        res.status(201).json({ status: "success", data: { category }, message: "Category created" });
    }
    catch (err) {
        next(err);
    }
};
exports.createCategory = createCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category)
            return next(new AppError_1.default("Category not found.", 404));
        category.isDeleted = true;
        category.deletedAt = new Date();
        await category.save();
        await (0, redis_1.cacheDel)(redis_1.KEYS.categories);
        res.status(200).json({ status: "success", data: null, message: "Category deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCategory = deleteCategory;
