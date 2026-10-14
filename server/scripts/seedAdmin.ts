/**
 * One-time admin account seeder.
 * Run: npm run seed:admin
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME from .env.
 * Exits safely if an admin already exists.
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

async function seedAdmin() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  const required = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) throw new Error(`Missing required admin seed variables: ${missing.join(", ")}`);
  if ((ADMIN_PASSWORD as string).length < 12) throw new Error("Admin seed password must be at least 12 characters.");

  await mongoose.connect(MONGO_URI as string);
  console.log("✅ Connected to MongoDB\n");

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${existing.email}`);
    console.log("   No changes made.\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD as string, 12);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    phone: "+0000000000",
    password: hashed,
    role: "admin",
  });

  console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
  console.log("   Run this script only once before going live.\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ seedAdmin failed:", err.message);
  process.exit(1);
});
