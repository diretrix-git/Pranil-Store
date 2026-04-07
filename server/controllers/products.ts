import { Request, Response, NextFunction } from "express";
import Product from "../models/Product";
import Category from "../models/Category";
import Vendor from "../models/Vendor";
import AppError from "../utils/AppError";
import { uploadToCloudinary, deleteCloudinaryImage, getPublicIdFromUrl } from "../utils/cloudinaryHelper";
import { cacheGet, cacheSet, cacheDel, invalidateProductCache, KEYS, TTL } from "../config/redis";

const POPULATE_OPTS = [
  { path: "categories", select: "name slug icon" },
  { path: "vendor", select: "name slug description contactPerson email phone" },
];

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageUrls = await Promise.all(req.files.map((f: any) => uploadToCloudinary(f.buffer, "markethub/products", f.mimetype)));
    }

    let categories = req.body.categories;
    if (typeof categories === "string") categories = categories.split(",").map((c: string) => c.trim()).filter(Boolean);

    let categoryName = "";
    if (categories?.length > 0) {
      const cat = await Category.findById(categories[0]);
      if (cat) categoryName = cat.name;
    }

    const product = await Product.create({
      name: req.body.name, description: req.body.description, price: req.body.price,
      stock: req.body.stock, unit: req.body.unit, categories: categories || [],
      category: categoryName, vendor: req.body.vendor || null, images: imageUrls,
    });

    await product.populate(POPULATE_OPTS);

    // Invalidate product list cache
    await invalidateProductCache();

    res.status(201).json({ status: "success", data: { product }, message: "Product created" });
  } catch (err) { next(err); }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Build a stable cache key from query params
    const qs = new URLSearchParams(req.query as any).toString();
    const cacheKey = KEYS.products(qs);

    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(200).json(cached);
      return;
    }

    const query: any = { isActive: true, isDeleted: false };

    if (req.query.search) query.name = { $regex: req.query.search, $options: "i" };

    if (req.query.category) {
      const cat = await Category.findOne({ $or: [{ slug: req.query.category }, { name: req.query.category }] });
      if (cat) query.categories = cat._id;
      else query.category = req.query.category;
    }

    if (req.query.vendor) {
      const vendor = await Vendor.findOne({
        $or: [{ slug: req.query.vendor }, { _id: /^[a-f\d]{24}$/i.test(req.query.vendor as string) ? req.query.vendor : null }],
      });
      if (vendor) query.vendor = vendor._id;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const products = await Product.find(query).populate(POPULATE_OPTS);
    const payload = { status: "success", data: { products, count: products.length }, message: "Products retrieved" };

    // Don't cache search queries — too dynamic
    if (!req.query.search) {
      await cacheSet(cacheKey, payload, TTL.PRODUCTS);
    }

    res.setHeader("X-Cache", "MISS");
    res.status(200).json(payload);
  } catch (err) { next(err); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = KEYS.product(req.params.id as string);
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(200).json(cached);
      return;
    }

    const product = await Product.findOne({ _id: req.params.id, isActive: true, isDeleted: false }).populate(POPULATE_OPTS);
    if (!product) return next(new AppError("Product not found.", 404));

    const payload = { status: "success", data: { product }, message: "Product retrieved" };
    await cacheSet(cacheKey, payload, TTL.PRODUCT_SINGLE);

    res.setHeader("X-Cache", "MISS");
    res.status(200).json(payload);
  } catch (err) { next(err); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return next(new AppError("Product not found.", 404));

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.body.images = await Promise.all(req.files.map((f: any) => uploadToCloudinary(f.buffer, "markethub/products", f.mimetype)));
    }

    if (req.body.categories) {
      let categories = req.body.categories;
      if (typeof categories === "string") categories = categories.split(",").map((c: string) => c.trim()).filter(Boolean);
      req.body.categories = categories;
      if (categories.length > 0) {
        const cat = await Category.findById(categories[0]);
        if (cat) req.body.category = cat.name;
      }
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate(POPULATE_OPTS);

    // Invalidate this product and all list caches
    await Promise.all([
      cacheDel(KEYS.product(req.params.id as string)),
      invalidateProductCache(),
    ]);

    res.status(200).json({ status: "success", data: { product }, message: "Product updated" });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return next(new AppError("Product not found.", 404));

    for (const imageUrl of product.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) await deleteCloudinaryImage(publicId);
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    await Promise.all([
      cacheDel(KEYS.product(req.params.id as string)),
      invalidateProductCache(),
    ]);

    res.status(200).json({ status: "success", data: null, message: "Product deleted" });
  } catch (err) { next(err); }
};
