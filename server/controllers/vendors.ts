import { Request, Response, NextFunction } from "express";
import Vendor from "../models/Vendor";
import AppError from "../utils/AppError";

export const getVendors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendors = await Vendor.find({ isDeleted: false, isActive: true }).sort("name");
    res.status(200).json({ status: "success", data: { vendors }, message: "Vendors retrieved" });
  } catch (err) { next(err); }
};

export const getAllVendors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vendors = await Vendor.find({ isDeleted: false }).sort("name");
    res.status(200).json({ status: "success", data: { vendors }, message: "Vendors retrieved" });
  } catch (err) { next(err); }
};

export const createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, contactPerson, email, phone, address, description } = req.body;
    const vendor = await Vendor.create({ name, contactPerson, email, phone, address, description });
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
    res.status(200).json({ status: "success", data: null, message: "Vendor deleted" });
  } catch (err) { next(err); }
};
