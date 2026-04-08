"use strict";
/**
 * One-time admin migration script.
 * Deletes ALL existing admin accounts and creates a fresh one.
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
const NEW_ADMIN = {
    name: "Krish",
    email: "taroluffy71@gmail.com",
    phone: "+0000000000",
    password: "PSWNAITHAXAINA@6430",
    role: "admin",
};
async function run() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");
    // Remove all existing admin accounts
    const deleted = await User_1.default.deleteMany({ role: "admin" });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing admin account(s)`);
    // Create new admin
    const hashed = await bcryptjs_1.default.hash(NEW_ADMIN.password, 12);
    await User_1.default.create({ ...NEW_ADMIN, password: hashed });
    console.log(`✅ New admin created: ${NEW_ADMIN.email}`);
    console.log(`   Password: ${NEW_ADMIN.password}\n`);
    await mongoose_1.default.disconnect();
    process.exit(0);
}
run().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
