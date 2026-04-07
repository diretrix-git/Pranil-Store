/**
 * One-time admin migration script.
 * Deletes ALL existing admin accounts and creates a fresh one.
 *
 * Run: npx ts-node scripts/migrateAdmin.ts
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

const NEW_ADMIN = {
  name: "Krish",
  email: "taroluffy71@gmail.com",
  phone: "+0000000000",
  password: "PSWNAITHAXAINA@6430",
  role: "admin" as const,
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("✅ Connected to MongoDB\n");

  // Remove all existing admin accounts
  const deleted = await User.deleteMany({ role: "admin" });
  console.log(`🗑️  Removed ${deleted.deletedCount} existing admin account(s)`);

  // Create new admin
  const hashed = await bcrypt.hash(NEW_ADMIN.password, 12);
  await User.create({ ...NEW_ADMIN, password: hashed });

  console.log(`✅ New admin created: ${NEW_ADMIN.email}`);
  console.log(`   Password: ${NEW_ADMIN.password}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
