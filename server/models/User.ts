import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

const addressSchema = new Schema(
  { street: String, city: String, state: String, zip: String },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["buyer", "admin"], default: "buyer", required: true },
    isActive: { type: Boolean, default: true },
    address: { type: addressSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ isDeleted: 1 });

export default mongoose.model<IUser>("User", userSchema);
