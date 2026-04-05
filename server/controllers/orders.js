const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { sendBuyerConfirmation, sendAdminNotification } = require('../utils/mailer');

const placeOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0)
      return next(new AppError('Your cart is empty.', 400));

    const stockErrors = [];
    for (const item of cart.items) {
      if (!item.product || item.product.stock < item.quantity) {
        stockErrors.push(`${item.name} (available: ${item.product?.stock ?? 0})`);
      }
    }
    if (stockErrors.length > 0) {
      return next(new AppError(`Insufficient stock for: ${stockErrors.join(', ')}`, 409));
    }

    const items = cart.items.map((item) => ({
      product: item.product._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      subtotal: item.price * item.quantity,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await Order.create({
      buyer: req.user._id,
      buyerSnapshot: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        address: req.user.address,
      },
      items,
      subtotal,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      notes: req.body.notes || '',
    });

    // Deduct stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // ── Emit real-time notification to admin_room ─────────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order', {
        orderNumber: order.orderNumber,
        buyerName: req.user.name,
        buyerPhone: req.user.phone || '',
        buyerId: req.user._id,
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.subtotal,
        })),
        totalAmount: order.totalAmount,
        orderId: order._id,
        placedAt: order.createdAt,
      });
    }

    // ── Send emails in background — never block the response ─────────────────
    Promise.all([
      sendBuyerConfirmation(order),
      sendAdminNotification(order),
    ]).catch((err) => logger.error(`Email send failed: ${err.message}`));

    // Respond immediately
    res.status(201).json({
      status: 'success',
      data: { order },
      message: 'Order placed successfully',
    });
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

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
    if (!order) return next(new AppError('Order not found.', 404));
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

module.exports = { placeOrder, getBuyerOrders, updateOrderStatus, getInvoice, getAllOrders };
