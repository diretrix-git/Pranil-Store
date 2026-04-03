const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    price: Number,
    image: String,
    unit: String,
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    quantity: { type: Number, min: 1, default: 1 },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

cartSchema.pre("save", function () {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
});

module.exports = mongoose.model("Cart", cartSchema);
