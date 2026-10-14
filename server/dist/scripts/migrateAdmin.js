"use strict";
/**
 * One-time admin migration script.
 * Deletes ALL existing admin accounts and creates a fresh one.
 * Reads credentials from .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
 *
 * Run: npx ts-node scripts/migrateAdmin.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
async function run() {
    const mongoUri = process.env.MONGO_URI;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Admin";
    const required = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0)
        throw new Error(`Missing required admin migration variables: ${missing.join(", ")}`);
    if (password.length < 12)
        throw new Error("Admin migration password must be at least 12 characters.");
    const hashed = await bcryptjs_1.default.hash(password, 12);
    await mongoose_1.default.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");
    const deleted = await User_1.default.deleteMany({ role: "admin" });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing admin account(s)`);
    await User_1.default.create({ name, email, phone: "+0000000000", password: hashed, role: "admin" });
    console.log(`✅ New admin created: ${email}\n`);
    await mongoose_1.default.disconnect();
    process.exit(0);
}
run().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
