const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { uploadToCloudinary, deleteCloudinaryImage, getPublicIdFromUrl } = require('../utils/cloudinaryHelper');

const POPULATE_OPTS = [
  { path: 'categories', select: 'name slug icon' },
  { path: 'vendor', select: 'name slug description contactPerson email phone' },
];

const createProduct = async (req, res, next) => {
  try {
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, 'markethub/products', f.mimetype))
      );
    }

    let categories = req.body.categories;
    if (typeof categories === 'string') {
      categories = categories.split(',').map((c) => c.trim()).filter(Boolean);
    }

    let categoryName = '';
    if (categories && categories.length > 0) {
      const cat = await Category.findById(categories[0]);
      if (cat) categoryName = cat.name;
    }

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      unit: req.body.unit,
      categories: categories || [],
      category: categoryName,
      vendor: req.body.vendor || null,
      images: imageUrls,
    });

    await product.populate(POPULATE_OPTS);
    res.status(201).json({ status: 'success', data: { product }, message: 'Product created' });
  } catch (err) { next(err); }
};

const getProducts = async (req, res, next) => {
  try {
    const query = { isActive: true, isDeleted: false };

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category) {
      const cat = await Category.findOne({
        $or: [{ slug: req.query.category }, { name: req.query.category }],
      });
      if (cat) query.categories = cat._id;
      else query.category = req.query.category;
    }

    if (req.query.vendor) {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({
        $or: [{ slug: req.query.vendor }, { _id: req.query.vendor.match(/^[a-f\d]{24}$/i) ? req.query.vendor : null }],
      });
      if (vendor) query.vendor = vendor._id;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const products = await Product.find(query).populate(POPULATE_OPTS);

    res.status(200).json({
      status: 'success',
      data: { products, count: products.length },
      message: 'Products retrieved',
    });
  } catch (err) { next(err); }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true, isDeleted: false })
      .populate(POPULATE_OPTS);

    if (!product) return next(new AppError('Product not found.', 404));

    res.status(200).json({ status: 'success', data: { product }, message: 'Product retrieved' });
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return next(new AppError('Product not found.', 404));

    if (req.files && req.files.length > 0) {
      req.body.images = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, 'markethub/products', f.mimetype))
      );
    }

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
    await product.populate(POPULATE_OPTS);

    res.status(200).json({ status: 'success', data: { product }, message: 'Product updated' });
  } catch (err) { next(err); }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return next(new AppError('Product not found.', 404));

    for (const imageUrl of product.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) await deleteCloudinaryImage(publicId);
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({ status: 'success', data: null, message: 'Product deleted' });
  } catch (err) { next(err); }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
