// ── Domain types ──────────────────────────────────────────────────────────────

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "admin";
  isActive: boolean;
  address?: IAddress;
}

export interface IVendor {
  _id: string;
  name: string;
  slug: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string | null;
  isActive: boolean;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export interface IProduct {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  categories: ICategory[];
  category?: string;
  vendor?: IVendor | null;
  price: number;
  stock: number;
  unit: string;
  images: string[];
  isActive: boolean;
  compareAtPrice?: number;
}

export interface ICartItem {
  product: string;
  name: string;
  price: number;
  image?: string | null;
  unit?: string;
  quantity: number;
}

export interface ICart {
  _id: string;
  buyer: string;
  items: ICartItem[];
  totalAmount: number;
}

export interface IOrderItem {
  product: string;
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

export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

export interface IOrder {
  _id: string;
  orderNumber: string;
  buyer: string;
  buyerSnapshot: IBuyerSnapshot;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: "unpaid" | "paid" | "refunded";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IContact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Notification types ────────────────────────────────────────────────────────

export interface OrderNotification {
  type: "order";
  orderNumber: string;
  buyerName: string;
  buyerPhone?: string;
  buyerId: string;
  orderId: string;
  items: { name: string; quantity: number; price: number; subtotal: number }[];
  totalAmount: number;
  placedAt: string;
  receivedAt: string;
}

export interface MessageNotification {
  type: "message";
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  receivedAt: string;
}

export type AppNotification = OrderNotification | MessageNotification;
