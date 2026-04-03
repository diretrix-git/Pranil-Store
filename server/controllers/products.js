const Product = require("../models/Product");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const {
  uploadToCloudinary,
  deleteCloudinaryImage,
  getPublicIdFromUrl,
} = require("../utils/cloudinaryHelper");

const createProduct = async (req, res, next) => {
  try {
    // Upload images to Cloudinary only if files were attached
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((f) =>
          uploadToCloudinary(f.buffer, "markethub/products", f.mimetype),
        ),
      );
    }

    let categories = req.body.categories;
    if (typeof categories === "string") {
      categories = categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }

    let categoryName = "";
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
      images: imageUrls,
    });

    await product.populate("categories", "name slug icon");
    res
      .status(201)
      .json({
        status: "success",
        data: { product },
        message: "Product created",
      });
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const query = { isActive: true, isDeleted: false };

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    if (req.query.category) {
      const cat = await Category.findOne({
        $or: [{ slug: req.query.category }, { name: req.query.category }],
      });
      if (cat) {
        query.categories = cat._id;
      } else {
        query.category = req.query.category;
      }
    }

    const products = await Product.find(query).populate(
      "categories",
      "name slug icon",
    );

    res.status(200).json({
      status: "success",
      data: { products, count: products.length },
      message: "Products retrieved",
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
    }).populate("categories", "name slug icon");

    if (!product) return next(new AppError("Product not found.", 404));

    res
      .status(200)
      .json({
        status: "success",
        data: { product },
        message: "Product retrieved",
      });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!product) return next(new AppError("Product not found.", 404));

    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      req.body.images = await Promise.all(
        req.files.map((f) =>
          uploadToCloudinary(f.buffer, "markethub/products", f.mimetype),
        ),
      );
    }

    if (req.body.categories) {
      let categories = req.body.categories;
      if (typeof categories === "string") {
        categories = categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }
      req.body.categories = categories;
      if (categories.length > 0) {
        const cat = await Category.findById(categories[0]);
        if (cat) req.body.category = cat.name;
      }
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate("categories", "name slug icon");

    res
      .status(200)
      .json({
        status: "success",
        data: { product },
        message: "Product updated",
      });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!product) return next(new AppError("Product not found.", 404));

    for (const imageUrl of product.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) await deleteCloudinaryImage(publicId);
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res
      .status(200)
      .json({ status: "success", data: null, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
