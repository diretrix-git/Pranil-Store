/**
 * One-time admin migration script.
 * Deletes ALL existing admin accounts and creates a fresh one.
 * Reads credentials from .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
 *
 * Run: npx ts-node scripts/migrateAdmin.ts
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("✅ Connected to MongoDB\n");

  const deleted = await User.deleteMany({ role: "admin" });
  console.log(`🗑️  Removed ${deleted.deletedCount} existing admin account(s)`);

  const hashed = await bcrypt.hash(password, 12);
  await User.create({ name, email, phone: "+0000000000", password: hashed, role: "admin" });

  console.log(`✅ New admin created: ${email}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
