import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import { IProduct } from "../types";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, lowercase: true },
    description: { type: String, trim: true },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    category: { type: String, trim: true },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    price: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "Stock must be an integer" },
    },
    unit: { type: String, default: "pcs", trim: true },
    images: [String],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

productSchema.index({ categories: 1 });
productSchema.index({ category: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ isActive: 1, isDeleted: 1 });

export default mongoose.model<IProduct>("Product", productSchema);
