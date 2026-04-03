const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ buyer: req.user._id });
    if (!cart) {
      cart = await Cart.create({ buyer: req.user._id, items: [] });
    }

    let priceChanged = false;
    for (const item of cart.items) {
      if (!item.product) continue; // skip orphaned items
      const product = await Product.findById(item.product);
      if (product && product.price !== item.price) {
        item.price = product.price;
        priceChanged = true;
      }
    }
    // Remove items whose products no longer exist
    cart.items = cart.items.filter((item) => item.product != null);
    if (priceChanged) await cart.save();

    res
      .status(200)
      .json({
        status: "success",
        data: { cart, priceChanged },
        message: "Cart retrieved",
      });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isDeleted: false,
    });
    if (!product) return next(new AppError("Product not found.", 404));

    let cart = await Cart.findOne({ buyer: req.user._id });
    if (!cart) cart = await Cart.create({ buyer: req.user._id, items: [] });

    if (
      cart.items.length > 0 &&
      cart.store &&
      cart.store.toString() !== product.store.toString()
    ) {
      return next(
        new AppError(
          "Your cart contains items from a different store. Please clear your cart first.",
          409,
        ),
      );
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product && i.product.toString() === productId.toString(),
    );
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : null,
        unit: product.unit,
        store: product.store,
        quantity,
      });
    }

    cart.store = product.store;
    await cart.save();

    res
      .status(200)
      .json({
        status: "success",
        data: { cart },
        message: "Item added to cart",
      });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ buyer: req.user._id });
    if (!cart) return next(new AppError("Cart not found.", 404));

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() === req.params.productId.toString(),
    );
    if (itemIndex === -1)
      return next(new AppError("Item not found in cart.", 404));

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    res
      .status(200)
      .json({ status: "success", data: { cart }, message: "Cart updated" });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id });
    if (!cart) return next(new AppError("Cart not found.", 404));

    cart.items = cart.items.filter(
      (i) => i.product.toString() !== req.params.productId.toString(),
    );
    await cart.save();

    res
      .status(200)
      .json({ status: "success", data: { cart }, message: "Item removed" });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id });
    if (cart) {
      cart.items = [];
      cart.store = null;
      await cart.save();
    }
    res
      .status(200)
      .json({ status: "success", data: null, message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
