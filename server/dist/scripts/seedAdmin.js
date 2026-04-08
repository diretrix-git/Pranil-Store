"use strict";
/**
 * One-time admin account seeder.
 * Run: npm run seed:admin
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME from .env.
 * Exits safely if an admin already exists.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
async function seedAdmin() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");
    const existing = await User_1.default.findOne({ role: "admin" });
    if (existing) {
        console.log(`⚠️  Admin already exists: ${existing.email}`);
        console.log("   No changes made.\n");
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
        console.error("❌ Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME in .env");
        process.exit(1);
    }
    const hashed = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 12);
    await User_1.default.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        phone: "+0000000000",
        password: hashed,
        role: "admin",
    });
    console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
    console.log("   Run this script only once before going live.\n");
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seedAdmin().catch((err) => {
    console.error("❌ seedAdmin failed:", err.message);
    process.exit(1);
});
