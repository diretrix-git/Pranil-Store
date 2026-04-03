const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    unit: String,
    subtotal: Number,
  },
  { _id: false }
);

const buyerSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
  },
  { _id: false }
);

const storeSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: String,
    logo: String,
    invoiceNote: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerSnapshot: { type: buyerSnapshotSchema },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    storeSnapshot: { type: storeSnapshotSchema },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.pre('save', function () {
  if (this.isNew) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.orderNumber = `ORD-${yyyy}${mm}${dd}-${rand}`;
  }
});

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });
// orderNumber already has unique:true on the field definition, no separate index needed

module.exports = mongoose.model('Order', orderSchema);
