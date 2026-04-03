const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, lowercase: true },
    description: { type: String, trim: true },
    // N:M — a product can belong to multiple categories
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    // Keep legacy string field for backward compat with public filter
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Stock must be an integer' },
    },
    unit: { type: String, default: 'pcs', trim: true },
    images: [String],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  // Keep legacy category string in sync with first category name
  // (populated after save by controller)
});

productSchema.index({ store: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
