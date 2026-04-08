"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const orderItemSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
    subtotal: Number,
}, { _id: false });
const buyerSnapshotSchema = new mongoose_1.Schema({
    name: String,
    phone: String,
    email: String,
    address: { street: String, city: String, state: String, zip: String },
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, unique: true },
    buyer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    buyerSnapshot: { type: buyerSnapshotSchema },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
        default: "pending",
    },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
orderSchema.pre("save", function () {
    if (this.isNew) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        this.orderNumber = `ORD-${yyyy}${mm}${dd}-${rand}`;
    }
});
orderSchema.index({ buyer: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Order", orderSchema);
