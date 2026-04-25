/**
 * Resets clerkId on all users so they re-sync to the new Clerk production instance on next login.
 * Run after switching from Clerk development → production instance.
 *
 * Run: npx ts-node scripts/resetClerkIds.ts
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("✅ Connected to MongoDB\n");

  const result = await User.updateMany({}, { $set: { clerkId: null } });
  console.log(`✅ Reset clerkId on ${result.modifiedCount} user(s)`);
  console.log("   Users will re-sync to Clerk production on next login.\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
