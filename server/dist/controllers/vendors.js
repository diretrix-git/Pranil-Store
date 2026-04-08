"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVendor = exports.updateVendor = exports.createVendor = exports.getAllVendors = exports.getVendors = void 0;
const Vendor_1 = __importDefault(require("../models/Vendor"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const redis_1 = require("../config/redis");
const getVendors = async (_req, res, next) => {
    try {
        const cached = await (0, redis_1.cacheGet)(redis_1.KEYS.vendorsPublic);
        if (cached) {
            res.setHeader("X-Cache", "HIT");
            res.status(200).json(cached);
            return;
        }
        const vendors = await Vendor_1.default.find({ isDeleted: false, isActive: true }).sort("name");
        const payload = { status: "success", data: { vendors }, message: "Vendors retrieved" };
        await (0, redis_1.cacheSet)(redis_1.KEYS.vendorsPublic, payload, redis_1.TTL.VENDORS_PUBLIC);
        res.setHeader("X-Cache", "MISS");
        res.status(200).json(payload);
    }
    catch (err) {
        next(err);
    }
};
exports.getVendors = getVendors;
const getAllVendors = async (_req, res, next) => {
    try {
        // Admin view — always fresh, no cache
        const vendors = await Vendor_1.default.find({ isDeleted: false }).sort("name");
        res.status(200).json({ status: "success", data: { vendors }, message: "Vendors retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllVendors = getAllVendors;
const createVendor = async (req, res, next) => {
    try {
        const { name, contactPerson, email, phone, address, description } = req.body;
        const vendor = await Vendor_1.default.create({ name, contactPerson, email, phone, address, description });
        await (0, redis_1.cacheDel)(redis_1.KEYS.vendorsPublic);
        res.status(201).json({ status: "success", data: { vendor }, message: "Vendor created" });
    }
    catch (err) {
        next(err);
    }
};
exports.createVendor = createVendor;
const updateVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor_1.default.findOne({ _id: req.params.id, isDeleted: false });
        if (!vendor)
            return next(new AppError_1.default("Vendor not found.", 404));
        const { name, contactPerson, email, phone, address, description, isActive } = req.body;
        Object.assign(vendor, { name, contactPerson, email, phone, address, description, isActive });
        await vendor.save();
        await (0, redis_1.cacheDel)(redis_1.KEYS.vendorsPublic);
        res.status(200).json({ status: "success", data: { vendor }, message: "Vendor updated" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateVendor = updateVendor;
const deleteVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor_1.default.findOne({ _id: req.params.id, isDeleted: false });
        if (!vendor)
            return next(new AppError_1.default("Vendor not found.", 404));
        vendor.isDeleted = true;
        vendor.deletedAt = new Date();
        await vendor.save();
        await (0, redis_1.cacheDel)(redis_1.KEYS.vendorsPublic);
        res.status(200).json({ status: "success", data: null, message: "Vendor deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteVendor = deleteVendor;
