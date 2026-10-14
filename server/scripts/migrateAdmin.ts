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
  const mongoUri = process.env.MONGO_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  const required = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) throw new Error(`Missing required admin migration variables: ${missing.join(", ")}`);
  if ((password as string).length < 12) throw new Error("Admin migration password must be at least 12 characters.");
  const hashed = await bcrypt.hash(password as string, 12);

  await mongoose.connect(mongoUri as string);
  console.log("✅ Connected to MongoDB\n");

  const deleted = await User.deleteMany({ role: "admin" });
  console.log(`🗑️  Removed ${deleted.deletedCount} existing admin account(s)`);

  await User.create({ name, email, phone: "+0000000000", password: hashed, role: "admin" });

  console.log(`✅ New admin created: ${email}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
