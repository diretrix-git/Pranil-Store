import { Request } from "express";
import { Document, Types } from "mongoose";

// ── User ──────────────────────────────────────────────────────────────────────
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "buyer" | "admin";
  isActive: boolean;
  address: IAddress;
  isDeleted: boolean;
  deletedAt: Date | null;
  clerkId?: string | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  categories: Types.ObjectId[];
  category?: string;
  vendor: Types.ObjectId | null;
  price: number;
  stock: number;
  unit: string;
  images: string[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Vendor ────────────────────────────────────────────────────────────────────
export interface IVendor extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Category ──────────────────────────────────────────────────────────────────
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface ICartItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  image?: string | null;
  unit?: string;
  quantity: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  buyer: Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Order ─────────────────────────────────────────────────────────────────────
export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  subtotal: number;
}

export interface IBuyerSnapshot {
  name: string;
  phone?: string;
  email: string;
  address?: IAddress;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  buyer: Types.ObjectId;
  buyerSnapshot: IBuyerSnapshot;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  notes?: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Contact ───────────────────────────────────────────────────────────────────
export interface IContact extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Express augmentation ──────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user: IUser;
}
