const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false }).select('-password');
    res.status(200).json({ status: 'success', data: { users, count: users.length }, message: 'Users retrieved' });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return next(new AppError('User not found.', 404));
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      status: 'success',
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};

const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalStores, totalOrders, revenueAgg] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Store.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false }),
      Order.aggregate([
        { $match: { isDeleted: false, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.status(200).json({
      status: 'success',
      data: { totalUsers, totalStores, totalOrders, totalRevenue },
      message: 'Stats retrieved',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, toggleUserStatus, getPlatformStats };
