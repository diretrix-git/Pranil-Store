/**
 * Optional local database seed. Account credentials come from environment variables.
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import Product from "./models/Product";
import Category from "./models/Category";

const FRESH = process.argv.includes("--fresh");

const CATEGORIES = [
  { name: "Electronics", slug: "electronics", icon: "💻", description: "Gadgets, devices and tech accessories" },
  { name: "Clothing",    slug: "clothing",    icon: "👕", description: "Apparel, fashion and accessories" },
  { name: "Food",        slug: "food",        icon: "🍎", description: "Groceries, snacks and beverages" },
  { name: "Books",       slug: "books",       icon: "📚", description: "Books, magazines and educational material" },
  { name: "Home",        slug: "home",        icon: "🏠", description: "Furniture, decor and household items" },
  { name: "Sports",      slug: "sports",      icon: "⚽", description: "Sports equipment and outdoor gear" },
];

const ADMIN = {
  name: process.env.ADMIN_NAME || "Admin",
  email: process.env.ADMIN_EMAIL as string,
  phone: "+1234567890",
  password: process.env.ADMIN_PASSWORD as string,
  role: "admin" as const,
};

const BUYER = {
  name: "Demo Buyer",
  email: process.env.SEED_BUYER_EMAIL as string,
  phone: "+1234567892",
  password: process.env.SEED_BUYER_PASSWORD as string,
  role: "buyer" as const,
};

const PRODUCTS = [
  { name: "Wireless Headphones", description: "High quality wireless headphones with noise cancellation.", price: 49.99, stock: 50, unit: "pcs", categorySlugs: ["electronics"] },
  { name: "Cotton T-Shirt",      description: "Comfortable 100% cotton t-shirt.",                         price: 19.99, stock: 100, unit: "pcs", categorySlugs: ["clothing"] },
  { name: "Organic Coffee Beans",description: "Premium organic coffee beans from Ethiopia.",               price: 14.99, stock: 200, unit: "bag", categorySlugs: ["food"] },
];

async function upsertUser(data: typeof ADMIN | typeof BUYER) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`   ⚠️  ${data.role} already exists (${data.email})`);
    return existing;
  }
  const hashed = await bcrypt.hash(data.password, 12);
  await User.create({ ...data, password: hashed });
  console.log(`   Created ${data.role}: ${data.email}`);
}

async function seed() {
  const required = ["MONGO_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SEED_BUYER_EMAIL", "SEED_BUYER_PASSWORD"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) throw new Error(`Missing required seed variables: ${missing.join(", ")}`);
  if ((process.env.ADMIN_PASSWORD as string).length < 12 || (process.env.SEED_BUYER_PASSWORD as string).length < 12) {
    throw new Error("Seed account passwords must be at least 12 characters.");
  }
  if (process.env.ADMIN_EMAIL?.trim().toLowerCase() === process.env.SEED_BUYER_EMAIL?.trim().toLowerCase()) {
    throw new Error("Admin and buyer seed accounts must use different email addresses.");
  }

  console.log("\n🌱  MarketHub Seed Script — Target: MongoDB Atlas\n");
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("✅ Connected\n");

  if (FRESH) {
    await Promise.all([User.deleteMany({}), Product.deleteMany({}), Category.deleteMany({})]);
    console.log("🗑️  Wiped all collections\n");
  }

  // Categories
  console.log("📂 Categories...");
  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      categoryMap[cat.slug] = existing._id as mongoose.Types.ObjectId;
      console.log(`   ⚠️  ${cat.name} exists`);
    } else {
      const c = await Category.create(cat);
      categoryMap[cat.slug] = c._id as mongoose.Types.ObjectId;
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
  const existingCount = await Product.countDocuments({});
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} products already exist — skipping`);
  } else {
    for (const p of PRODUCTS) {
      const { categorySlugs, ...rest } = p;
      const categoryIds = categorySlugs.map((s) => categoryMap[s]).filter(Boolean);
      const primaryCat = CATEGORIES.find((c) => c.slug === categorySlugs[0]);
      await Product.create({ ...rest, categories: categoryIds, category: primaryCat?.name ?? "" });
      console.log(`   ✅ ${p.name}`);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log("✅ Done!\n");
  console.log(`  Admin : ${ADMIN.email}`);
  console.log(`  Buyer : ${BUYER.email}`);
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message, "\n", err.stack);
  process.exit(1);
});
