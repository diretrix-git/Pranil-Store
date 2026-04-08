"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const getCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let cart = await Cart_1.default.findOne({ buyer: userId });
        if (!cart)
            cart = await Cart_1.default.create({ buyer: userId, items: [] });
        let priceChanged = false;
        for (const item of cart.items) {
            if (!item.product)
                continue;
            const product = await Product_1.default.findById(item.product);
            if (product && product.price !== item.price) {
                item.price = product.price;
                priceChanged = true;
            }
        }
        cart.items = cart.items.filter((item) => item.product != null);
        if (priceChanged)
            await cart.save();
        res.status(200).json({ status: "success", data: { cart, priceChanged }, message: "Cart retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getCart = getCart;
const addItem = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;
        const product = await Product_1.default.findOne({ _id: productId, isActive: true, isDeleted: false });
        if (!product)
            return next(new AppError_1.default("Product not found.", 404));
        let cart = await Cart_1.default.findOne({ buyer: userId });
        if (!cart)
            cart = await Cart_1.default.create({ buyer: userId, items: [] });
        const existingIndex = cart.items.findIndex((i) => i.product && i.product.toString() === productId.toString());
        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += quantity;
        }
        else {
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
    }
    catch (err) {
        next(err);
    }
};
exports.addItem = addItem;
const updateItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart_1.default.findOne({ buyer: req.user._id });
        if (!cart)
            return next(new AppError_1.default("Cart not found.", 404));
        const itemIndex = cart.items.findIndex((i) => i.product.toString() === req.params.productId.toString());
        if (itemIndex === -1)
            return next(new AppError_1.default("Item not found in cart.", 404));
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }
        else {
            cart.items[itemIndex].quantity = quantity;
        }
        await cart.save();
        res.status(200).json({ status: "success", data: { cart }, message: "Cart updated" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateItem = updateItem;
const removeItem = async (req, res, next) => {
    try {
        const cart = await Cart_1.default.findOne({ buyer: req.user._id });
        if (!cart)
            return next(new AppError_1.default("Cart not found.", 404));
        cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId.toString());
        await cart.save();
        res.status(200).json({ status: "success", data: { cart }, message: "Item removed" });
    }
    catch (err) {
        next(err);
    }
};
exports.removeItem = removeItem;
const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart_1.default.findOne({ buyer: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ status: "success", data: null, message: "Cart cleared" });
    }
    catch (err) {
        next(err);
    }
};
exports.clearCart = clearCart;
