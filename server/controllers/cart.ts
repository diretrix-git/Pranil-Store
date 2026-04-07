import { Request, Response, NextFunction } from "express";
import Cart from "../models/Cart";
import Product from "../models/Product";
import AppError from "../utils/AppError";

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    let cart = await Cart.findOne({ buyer: userId });
    if (!cart) cart = await Cart.create({ buyer: userId, items: [] });

    let priceChanged = false;
    for (const item of cart.items) {
      if (!item.product) continue;
      const product = await Product.findById(item.product);
      if (product && product.price !== item.price) {
        item.price = product.price;
        priceChanged = true;
      }
    }
    cart.items = cart.items.filter((item) => item.product != null);
    if (priceChanged) await cart.save();

    res.status(200).json({ status: "success", data: { cart, priceChanged }, message: "Cart retrieved" });
  } catch (err) { next(err); }
};

export const addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = (req as any).user._id;

    const product = await Product.findOne({ _id: productId, isActive: true, isDeleted: false });
    if (!product) return next(new AppError("Product not found.", 404));

    let cart = await Cart.findOne({ buyer: userId });
    if (!cart) cart = await Cart.create({ buyer: userId, items: [] });

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
        image: product.images?.[0] ?? null,
        unit: product.unit,
        quantity,
      });
    }

    await cart.save();
    res.status(200).json({ status: "success", data: { cart }, message: "Item added to cart" });
  } catch (err) { next(err); }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ buyer: (req as any).user._id });
    if (!cart) return next(new AppError("Cart not found.", 404));

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() === req.params.productId.toString(),
    );
    if (itemIndex === -1) return next(new AppError("Item not found in cart.", 404));

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    res.status(200).json({ status: "success", data: { cart }, message: "Cart updated" });
  } catch (err) { next(err); }
};

export const removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await Cart.findOne({ buyer: (req as any).user._id });
    if (!cart) return next(new AppError("Cart not found.", 404));
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId.toString());
    await cart.save();
    res.status(200).json({ status: "success", data: { cart }, message: "Item removed" });
  } catch (err) { next(err); }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await Cart.findOne({ buyer: (req as any).user._id });
    if (cart) { cart.items = []; await cart.save(); }
    res.status(200).json({ status: "success", data: null, message: "Cart cleared" });
  } catch (err) { next(err); }
};
