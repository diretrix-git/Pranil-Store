const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const issueToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const existing = await User.findOne({ email, isDeleted: false });
    if (existing) {
      return next(new AppError('Email already in use.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, phone, password: hashedPassword, role });

    if (role === 'seller') {
      try {
        const store = await Store.create({ name: `${name}'s Store`, owner: user._id });
        user.store = store._id;
        await user.save({ validateModifiedOnly: true });
      } catch (storeErr) {
        // If store creation fails, still return the user (store can be created later)
        logger.warn(`Store creation failed for user ${user._id}: ${storeErr.message}`);
      }
    }

    const token = issueToken(user._id);
    setCookie(res, token);

    return res.status(201).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          store: user.store,
        },
      },
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    const token = issueToken(user._id);
    setCookie(res, token);

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          store: user.store,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1,
    });

    return res.status(200).json({
      status: 'success',
      data: null,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'success',
      data: { user: req.user },
      message: 'User profile retrieved',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
