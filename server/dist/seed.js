"use strict";
/**
 * Seed Script — MarketHub
 *
 * Creates:
 *   - Categories (Electronics, Clothing, Food, Books, Home, Sports)
 *   - 1 Admin     →  taroluffy71@gmail.com / PSWNAITHAXAINA@6430
 *   - 1 Buyer     →  buyer@markethub.com / Buyer@1234
 *   - 3 Sample products
 *
 * Usage:
 *   npx ts-node seed.ts           — skip existing records
 *   npx ts-node seed.ts --fresh   — wipe everything and re-seed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("./models/User"));
const Product_1 = __importDefault(require("./models/Product"));
const Category_1 = __importDefault(require("./models/Category"));
const FRESH = process.argv.includes("--fresh");
const CATEGORIES = [
    { name: "Electronics", slug: "electronics", icon: "💻", description: "Gadgets, devices and tech accessories" },
    { name: "Clothing", slug: "clothing", icon: "👕", description: "Apparel, fashion and accessories" },
    { name: "Food", slug: "food", icon: "🍎", description: "Groceries, snacks and beverages" },
    { name: "Books", slug: "books", icon: "📚", description: "Books, magazines and educational material" },
    { name: "Home", slug: "home", icon: "🏠", description: "Furniture, decor and household items" },
    { name: "Sports", slug: "sports", icon: "⚽", description: "Sports equipment and outdoor gear" },
];
const ADMIN = {
    name: process.env.ADMIN_NAME || "Admin",
    email: process.env.ADMIN_EMAIL || "admin@markethub.com",
    phone: "+1234567890",
    password: process.env.ADMIN_PASSWORD || "Admin@1234",
    role: "admin",
};
const BUYER = {
    name: "Demo Buyer",
    email: "buyer@markethub.com",
    phone: "+1234567892",
    password: "Buyer@1234",
    role: "buyer",
};
const PRODUCTS = [
    { name: "Wireless Headphones", description: "High quality wireless headphones with noise cancellation.", price: 49.99, stock: 50, unit: "pcs", categorySlugs: ["electronics"] },
    { name: "Cotton T-Shirt", description: "Comfortable 100% cotton t-shirt.", price: 19.99, stock: 100, unit: "pcs", categorySlugs: ["clothing"] },
    { name: "Organic Coffee Beans", description: "Premium organic coffee beans from Ethiopia.", price: 14.99, stock: 200, unit: "bag", categorySlugs: ["food"] },
];
async function upsertUser(data) {
    const existing = await User_1.default.findOne({ email: data.email });
    if (existing) {
        console.log(`   ⚠️  ${data.role} already exists (${data.email})`);
        return existing;
    }
    const hashed = await bcryptjs_1.default.hash(data.password, 12);
    await User_1.default.create({ ...data, password: hashed });
    console.log(`   ✅ ${data.email} / ${data.password}`);
}
async function seed() {
    console.log("\n🌱  MarketHub Seed Script — Target: MongoDB Atlas\n");
    await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");
    if (FRESH) {
        await Promise.all([User_1.default.deleteMany({}), Product_1.default.deleteMany({}), Category_1.default.deleteMany({})]);
        console.log("🗑️  Wiped all collections\n");
    }
    // Categories
    console.log("📂 Categories...");
    const categoryMap = {};
    for (const cat of CATEGORIES) {
        const existing = await Category_1.default.findOne({ slug: cat.slug });
        if (existing) {
            categoryMap[cat.slug] = existing._id;
            console.log(`   ⚠️  ${cat.name} exists`);
        }
        else {
            const c = await Category_1.default.create(cat);
            categoryMap[cat.slug] = c._id;
            console.log(`   ✅ ${cat.icon} ${cat.name}`);
        }
    }
    // Admin
    console.log("\n👑 Admin...");
    await upsertUser(ADMIN);
    // Buyer
    console.log("\n🛒 Buyer...");
    await upsertUser(BUYER);
    // Products
    console.log("\n📦 Products...");
    const existingCount = await Product_1.default.countDocuments({});
    if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} products already exist — skipping`);
    }
    else {
        for (const p of PRODUCTS) {
            const { categorySlugs, ...rest } = p;
            const categoryIds = categorySlugs.map((s) => categoryMap[s]).filter(Boolean);
            const primaryCat = CATEGORIES.find((c) => c.slug === categorySlugs[0]);
            await Product_1.default.create({ ...rest, categories: categoryIds, category: primaryCat?.name ?? "" });
            console.log(`   ✅ ${p.name}`);
        }
    }
    console.log("\n─────────────────────────────────────────");
    console.log("✅ Done!\n");
    console.log(`  👑 Admin : ${ADMIN.email} / ${ADMIN.password}`);
    console.log(`  🛒 Buyer : ${BUYER.email} / ${BUYER.password}`);
    console.log("─────────────────────────────────────────\n");
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error("\n❌ Seed failed:", err.message, "\n", err.stack);
    process.exit(1);
});
