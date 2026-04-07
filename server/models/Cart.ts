import mongoose, { Schema } from "mongoose";
import { ICart } from "../types";

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    image: String,
    unit: String,
    quantity: { type: Number, min: 1, default: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

cartSchema.pre("save", function () {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

export default mongoose.model<ICart>("Cart", cartSchema);
