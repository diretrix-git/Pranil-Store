const AppError = require("../utils/AppError");

const requireStore = (req, res, next) => {
  if (!req.user.store) {
    return next(new AppError("No store associated with this account.", 403));
  }

  req.storeId = req.user.store;
  next();
};

module.exports = { requireStore };
