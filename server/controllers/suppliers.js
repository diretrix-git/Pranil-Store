const Supplier = require('../models/Supplier');
const AppError = require('../utils/AppError');

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({ ...req.body, store: req.storeId });
    res.status(201).json({ status: 'success', data: { supplier }, message: 'Supplier created' });
  } catch (err) {
    next(err);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ store: req.storeId, isDeleted: false });
    res.status(200).json({ status: 'success', data: { suppliers, count: suppliers.length }, message: 'Suppliers retrieved' });
  } catch (err) {
    next(err);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, isDeleted: false });
    if (!supplier) return next(new AppError('Supplier not found.', 404));
    if (supplier.store.toString() !== req.storeId.toString()) return next(new AppError('Not authorized.', 403));
    Object.assign(supplier, req.body);
    await supplier.save();
    res.status(200).json({ status: 'success', data: { supplier }, message: 'Supplier updated' });
  } catch (err) {
    next(err);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, isDeleted: false });
    if (!supplier) return next(new AppError('Supplier not found.', 404));
    if (supplier.store.toString() !== req.storeId.toString()) return next(new AppError('Not authorized.', 403));
    supplier.isDeleted = true;
    supplier.deletedAt = new Date();
    await supplier.save();
    res.status(200).json({ status: 'success', data: null, message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSupplier, getSuppliers, updateSupplier, deleteSupplier };
