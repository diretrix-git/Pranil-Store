const Category = require('../models/Category');
const AppError = require('../utils/AppError');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, isDeleted: false }).sort('name');
    res.status(200).json({ status: 'success', data: { categories }, message: 'Categories retrieved' });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return next(new AppError('Category already exists.', 409));
    const category = await Category.create({ name, slug, icon: icon || '📦', description });
    res.status(201).json({ status: 'success', data: { category }, message: 'Category created' });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError('Category not found.', 404));
    category.isDeleted = true;
    category.deletedAt = new Date();
    await category.save();
    res.status(200).json({ status: 'success', data: null, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
