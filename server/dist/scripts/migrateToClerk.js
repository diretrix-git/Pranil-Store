"use strict";
/**
 * Migrates existing MongoDB users into Clerk.
 *
 * - Admin: created with the known password from .env (ADMIN_PASSWORD)
 * - Buyers: created with a random temp password (they use Forgot Password to set their own)
 * - Sets publicMetadata.role on each Clerk user
 * - Writes clerkId back into MongoDB
 *
 * Run: npx ts-node scripts/migrateToClerk.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = require("@clerk/express");
const User_1 = __importDefault(require("../models/User"));
const clerk = (0, express_1.createClerkClient)({ secretKey: process.env.CLERK_SECRET_KEY });
async function run() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");
    const users = await User_1.default.find({ isDeleted: false });
    console.log(`Found ${users.length} user(s) to migrate\n`);
    for (const user of users) {
        if (user.clerkId) {
            console.log(`⏭️  Skipping ${user.email} — already migrated`);
            continue;
        }
        try {
            // Check if already in Clerk
            const existing = await clerk.users.getUserList({ emailAddress: [user.email] });
            let clerkUser;
            if (existing.totalCount > 0) {
                clerkUser = existing.data[0];
                console.log(`⚠️  ${user.email} already in Clerk — linking`);
            }
            else {
                const isAdmin = user.role === "admin";
                const password = isAdmin
                    ? process.env.ADMIN_PASSWORD
                    : `Temp_${Math.random().toString(36).slice(2, 10)}@1`;
                const nameParts = user.name.trim().split(" ");
                const firstName = nameParts[0] || "User";
                const lastName = nameParts.slice(1).join(" ") || undefined;
                clerkUser = await clerk.users.createUser({
                    emailAddress: [user.email],
                    firstName,
                    ...(lastName ? { lastName } : {}),
                    password,
                    publicMetadata: { role: user.role },
                    skipPasswordChecks: true,
                });
                console.log(isAdmin
                    ? `✅ Admin created: ${user.email} (password: ${password})`
                    : `✅ Buyer created: ${user.email} (temp password set — tell them to use Forgot Password)`);
            }
            // Ensure role is set in publicMetadata
            await clerk.users.updateUser(clerkUser.id, {
                publicMetadata: { role: user.role },
            });
            // Link clerkId back to MongoDB
            await User_1.default.findByIdAndUpdate(user._id, { clerkId: clerkUser.id });
        }
        catch (err) {
            const detail = err?.errors?.[0]?.longMessage ?? err.message;
            console.error(`❌ Failed for ${user.email}: ${detail}`);
        }
    }
    console.log("\n─────────────────────────────────────────");
    console.log("✅ Migration complete");
    console.log("   Admin: log in with existing password");
    console.log("   Buyers: use Forgot Password on the sign-in page");
    console.log("─────────────────────────────────────────\n");
    await mongoose_1.default.disconnect();
    process.exit(0);
}
run().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
