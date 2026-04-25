"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProduct = exports.getProducts = exports.createProduct = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const Vendor_1 = __importDefault(require("../models/Vendor"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const cloudinaryHelper_1 = require("../utils/cloudinaryHelper");
const redis_1 = require("../config/redis");
const POPULATE_OPTS = [
    { path: "categories", select: "name slug icon" },
    { path: "vendor", select: "name slug description contactPerson email phone" },
];
const createProduct = async (req, res, next) => {
    try {
        let imageUrls = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            imageUrls = await Promise.all(req.files.map((f) => (0, cloudinaryHelper_1.uploadToCloudinary)(f.buffer, "markethub/products", f.mimetype)));
        }
        let categories = req.body.categories;
        if (typeof categories === "string")
            categories = categories.split(",").map((c) => c.trim()).filter(Boolean);
        let categoryName = "";
        if (categories?.length > 0) {
            const cat = await Category_1.default.findById(categories[0]);
            if (cat)
                categoryName = cat.name;
        }
        const product = await Product_1.default.create({
            name: req.body.name, description: req.body.description, price: req.body.price,
            stock: req.body.stock, unit: req.body.unit, categories: categories || [],
            category: categoryName, vendor: req.body.vendor || null, images: imageUrls,
        });
        await product.populate(POPULATE_OPTS);
        // Invalidate product list cache
        await (0, redis_1.invalidateProductCache)();
        res.status(201).json({ status: "success", data: { product }, message: "Product created" });
    }
    catch (err) {
        next(err);
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res, next) => {
    try {
        // Build a stable cache key from query params
        const qs = new URLSearchParams(req.query).toString();
        const cacheKey = redis_1.KEYS.products(qs);
        const cached = await (0, redis_1.cacheGet)(cacheKey);
        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.status(200).json(cached);
            return;
        }
        const query = { isActive: true, isDeleted: false };
        if (req.query.search) {
            // Escape regex special chars to prevent ReDoS
            const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
            query.name = { $regex: escaped, $options: "i" };
        }
        if (req.query.category) {
            const cat = await Category_1.default.findOne({ $or: [{ slug: req.query.category }, { name: req.query.category }] });
            if (cat)
                query.categories = cat._id;
            else
                query.category = req.query.category;
        }
        if (req.query.vendor) {
            const vendor = await Vendor_1.default.findOne({
                $or: [{ slug: req.query.vendor }, { _id: /^[a-f\d]{24}$/i.test(req.query.vendor) ? req.query.vendor : null }],
            });
            if (vendor)
                query.vendor = vendor._id;
        }
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice)
                query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice)
                query.price.$lte = Number(req.query.maxPrice);
        }
        const products = await Product_1.default.find(query).populate(POPULATE_OPTS);
        const payload = { status: "success", data: { products, count: products.length }, message: "Products retrieved" };
        // Don't cache search queries — too dynamic
        if (!req.query.search) {
            await (0, redis_1.cacheSet)(cacheKey, payload, redis_1.TTL.PRODUCTS);
        }
        res.setHeader("X-Cache", "MISS");
        res.status(200).json(payload);
    }
    catch (err) {
        next(err);
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res, next) => {
    try {
        const cacheKey = redis_1.KEYS.product(req.params.id);
        const cached = await (0, redis_1.cacheGet)(cacheKey);
        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.status(200).json(cached);
            return;
        }
        const product = await Product_1.default.findOne({ _id: req.params.id, isActive: true, isDeleted: false }).populate(POPULATE_OPTS);
        if (!product)
            return next(new AppError_1.default("Product not found.", 404));
        const payload = { status: "success", data: { product }, message: "Product retrieved" };
        await (0, redis_1.cacheSet)(cacheKey, payload, redis_1.TTL.PRODUCT_SINGLE);
        res.setHeader("X-Cache", "MISS");
        res.status(200).json(payload);
    }
    catch (err) {
        next(err);
    }
};
exports.getProduct = getProduct;
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findOne({ _id: req.params.id, isDeleted: false });
        if (!product)
            return next(new AppError_1.default("Product not found.", 404));
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            req.body.images = await Promise.all(req.files.map((f) => (0, cloudinaryHelper_1.uploadToCloudinary)(f.buffer, "markethub/products", f.mimetype)));
        }
        if (req.body.categories) {
            let categories = req.body.categories;
            if (typeof categories === "string")
                categories = categories.split(",").map((c) => c.trim()).filter(Boolean);
            req.body.categories = categories;
            if (categories.length > 0) {
                const cat = await Category_1.default.findById(categories[0]);
                if (cat)
                    req.body.category = cat.name;
            }
        }
        const allowed = ["name", "description", "price", "stock", "unit", "categories", "category", "vendor", "images", "isActive"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                updates[key] = req.body[key];
        }
        Object.assign(product, updates);
        await product.save();
        await product.populate(POPULATE_OPTS);
        // Invalidate this product and all list caches
        await Promise.all([
            (0, redis_1.cacheDel)(redis_1.KEYS.product(req.params.id)),
            (0, redis_1.invalidateProductCache)(),
        ]);
        res.status(200).json({ status: "success", data: { product }, message: "Product updated" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product_1.default.findOne({ _id: req.params.id, isDeleted: false });
        if (!product)
            return next(new AppError_1.default("Product not found.", 404));
        for (const imageUrl of product.images) {
            const publicId = (0, cloudinaryHelper_1.getPublicIdFromUrl)(imageUrl);
            if (publicId)
                await (0, cloudinaryHelper_1.deleteCloudinaryImage)(publicId);
        }
        product.isDeleted = true;
        product.deletedAt = new Date();
        await product.save();
        await Promise.all([
            (0, redis_1.cacheDel)(redis_1.KEYS.product(req.params.id)),
            (0, redis_1.invalidateProductCache)(),
        ]);
        res.status(200).json({ status: "success", data: null, message: "Product deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProduct = deleteProduct;
