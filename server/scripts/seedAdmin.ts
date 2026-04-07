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
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("✅ Connected to MongoDB\n");

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${existing.email}`);
    console.log("   No changes made.\n");
    await mongoose.disconnect();
    process.exit(0);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.error("❌ Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME in .env");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
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
