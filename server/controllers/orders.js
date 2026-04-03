const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const placeOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return next(new AppError('Your cart is empty.', 400));

    // Validate stock for all items
    const stockErrors = [];
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        stockErrors.push(`${item.name} (available: ${item.product.stock})`);
      }
    }
    if (stockErrors.length > 0) {
      return next(new AppError(`Insufficient stock for: ${stockErrors.join(', ')}`, 409));
    }

    const store = await Store.findById(cart.store);

    const items = cart.items.map((item) => ({
      product: item.product._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      subtotal: item.price * item.quantity,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const orderData = {
      buyer: req.user._id,
      buyerSnapshot: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        address: req.user.address,
      },
      store: cart.store,
      storeSnapshot: {
        name: store.name,
        phone: store.phone,
        email: store.email,
        address: store.address,
        logo: store.logo,
        invoiceNote: store.invoiceNote,
      },
      items,
      subtotal,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      notes: req.body.notes || '',
    };

    const order = await Order.create(orderData);

    // Atomically deduct stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    cart.items = [];
    cart.store = null;
    await cart.save();

    res.status(201).json({ status: 'success', data: { order }, message: 'Order placed successfully' });
  } catch (err) {
    next(err);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { orders, count: orders.length }, message: 'Orders retrieved' });
  } catch (err) {
    next(err);
  }
};

const getStoreOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ store: req.storeId, isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { orders, count: orders.length }, message: 'Orders retrieved' });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
    if (!order) return next(new AppError('Order not found.', 404));
    if (order.store.toString() !== req.storeId.toString()) return next(new AppError('Not authorized.', 403));
    order.status = req.body.status;
    await order.save();
    res.status(200).json({ status: 'success', data: { order }, message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
    if (!order) return next(new AppError('Order not found.', 404));

    if (req.user.role === 'buyer' && order.buyer.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized.', 403));
    }
    if (req.user.role === 'seller' && order.store.toString() !== req.storeId.toString()) {
      return next(new AppError('Not authorized.', 403));
    }

    res.status(200).json({ status: 'success', data: { order }, message: 'Invoice retrieved' });
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { orders, count: orders.length }, message: 'All orders retrieved' });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getBuyerOrders, getStoreOrders, updateOrderStatus, getInvoice, getAllOrders };
