import mongoose, { Schema } from "mongoose";
import { IVendor } from "../types";

const vendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    description: { type: String, trim: true },
    logo: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

vendorSchema.index({ isActive: 1, isDeleted: 1 });

vendorSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

export default mongoose.model<IVendor>("Vendor", vendorSchema);
