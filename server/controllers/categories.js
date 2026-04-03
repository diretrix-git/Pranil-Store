const Category = require('../models/Category');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, isDeleted: false }).sort('name');
    res.status(200).json({ status: 'success', data: { categories }, message: 'Categories retrieved' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories };
