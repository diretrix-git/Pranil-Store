const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['buyer', 'seller', 'superadmin'], required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    isActive: { type: Boolean, default: true },
    address: { type: addressSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('User', userSchema);
