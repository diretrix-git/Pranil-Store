import { Request, Response, NextFunction } from "express";
import Vendor from "../models/Vendor";
import AppError from "../utils/AppError";
import { cacheGet, cacheSet, cacheDel, KEYS, TTL } from "../config/redis";

export const getVendors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cached = await cacheGet<any>(KEYS.vendorsPublic);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(200).json(cached);
      return;
    }

    const vendors = await Vendor.find({ isDeleted: false, isActive: true }).sort("name");
    const payload = { status: "success", data: { vendors }, message: "Vendors retrieved" };
    await cacheSet(KEYS.vendorsPublic, payload, TTL.VENDORS_PUBLIC);

    res.setHeader("X-Cache", "MISS");
    res.status(200).json(payload);
  } catch (err) { next(err); }
};

export const getAllVendors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Admin view — always fresh, no cache
    const vendors = await Vendor.find({ isDeleted: false }).sort("name");
    res.status(200).json({ status: "success", data: { vendors }, message: "Vendors retrieved" });
  } catch (err) { next(err); }
};

export const createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, contactPerson, email, phone, address, description } = req.body;
    const vendor = await Vendor.create({ name, contactPerson, email, phone, address, description });
    await cacheDel(KEYS.vendorsPublic);
    res.status(201).json({ status: "success", data: { vendor }, message: "Vendor created" });
  } catch (err) { next(err); }
};

export const updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: false });
    if (!vendor) return next(new AppError("Vendor not found.", 404));
    const { name, contactPerson, email, phone, address, description, isActive } = req.body;
    Object.assign(vendor, { name, contactPerson, email, phone, address, description, isActive });
    await vendor.save();
    await cacheDel(KEYS.vendorsPublic);
    res.status(200).json({ status: "success", data: { vendor }, message: "Vendor updated" });
  } catch (err) { next(err); }
};

export const deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: false });
    if (!vendor) return next(new AppError("Vendor not found.", 404));
    vendor.isDeleted = true;
    vendor.deletedAt = new Date();
    await vendor.save();
    await cacheDel(KEYS.vendorsPublic);
    res.status(200).json({ status: "success", data: null, message: "Vendor deleted" });
  } catch (err) { next(err); }
};
