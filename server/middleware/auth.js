const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (user.isDeleted) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
