const mongoose = require('mongoose');
const slugify = require('slugify');

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    logo: { type: String, default: null },
    description: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    invoiceNote: { type: String, default: 'Thank you for your purchase!' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

storeSchema.pre('save', function () {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    const suffix = this.owner
      ? this.owner.toString().slice(-6)
      : Math.random().toString(36).slice(-6);
    this.slug = `${base}-${suffix}`;
  }
});

module.exports = mongoose.model('Store', storeSchema);
