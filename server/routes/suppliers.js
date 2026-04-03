const express = require('express');
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('../controllers/suppliers');
const { supplierValidation } = require('../validators/suppliers');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireStore } = require('../middleware/requireStore');
const { restrictTo } = require('../middleware/restrictTo');

const router = express.Router();

router.use(protect, requireStore, restrictTo('seller'));

router.get('/', getSuppliers);
router.post('/', supplierValidation, validate, createSupplier);
router.put('/:id', validate, updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
