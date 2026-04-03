const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { deleteCloudinaryImage, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

const createProduct = async (req, res, next) => {
  try {
    const imageUrls = req.files ? req.files.map((f) => f.path) : [];

    // categories comes as comma-separated IDs or array
    let categories = req.body.categories;
    if (typeof categories === 'string') {
      categories = categories.split(',').map((c) => c.trim()).filter(Boolean);
    }

    // Derive legacy category string from first category name
    let categoryName = '';
    if (categories && categories.length > 0) {
      const cat = await Category.findById(categories[0]);
      if (cat) categoryName = cat.name;
    }

    const product = await Product.create({
      ...req.body,
      categories: categories || [],
      category: categoryName,
      store: req.storeId,
      images: imageUrls,
    });

    await product.populate('categories', 'name slug icon');
    res.status(201).json({ status: 'success', data: { product }, message: 'Product created' });
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const query = { isActive: true, isDeleted: false };

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category) {
      // Support filtering by category name or ID
      const cat = await Category.findOne({
        $or: [{ slug: req.query.category }, { name: req.query.category }],
      });
      if (cat) {
        query.categories = cat._id;
      } else {
        query.category = req.query.category;
      }
    }

    // If seller is requesting, filter by their store only
    if (req.query.storeId) {
      query.store = req.query.storeId;
    }

    const products = await Product.find(query)
      .populate('store', 'name slug logo')
      .populate('categories', 'name slug icon');

    res.status(200).json({
      status: 'success',
      data: { products, count: products.length },
      message: 'Products retrieved',
    });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      isDeleted: false,
    })
      .populate('store', 'name slug logo')
      .populate('categories', 'name slug icon');

    if (!product) return next(new AppError('Product not found.', 404));

    res.status(200).json({ status: 'success', data: { product }, message: 'Product retrieved' });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });

    if (!product) return next(new AppError('Product not found.', 404));

    if (product.store.toString() !== req.storeId.toString()) {
      return next(new AppError('Not authorized.', 403));
    }

    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map((f) => f.path);
    }

    // Handle categories update
    if (req.body.categories) {
      let categories = req.body.categories;
      if (typeof categories === 'string') {
        categories = categories.split(',').map((c) => c.trim()).filter(Boolean);
      }
      req.body.categories = categories;

      if (categories.length > 0) {
        const cat = await Category.findById(categories[0]);
        if (cat) req.body.category = cat.name;
      }
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate('categories', 'name slug icon');

    res.status(200).json({ status: 'success', data: { product }, message: 'Product updated' });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });

    if (!product) return next(new AppError('Product not found.', 404));

    if (product.store.toString() !== req.storeId.toString()) {
      return next(new AppError('Not authorized.', 403));
    }

    for (const imageUrl of product.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) await deleteCloudinaryImage(publicId);
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({ status: 'success', data: null, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
