/**
 * Seed Script — MarketHub
 *
 * All data is written to MongoDB Atlas (MONGO_URI in .env).
 *
 * Creates:
 *   - Categories (Electronics, Clothing, Food, Books, Home, Sports)
 *   - 1 Superadmin  →  admin@markethub.com  / Admin@1234
 *   - 1 Seller      →  seller@markethub.com / Seller@1234
 *   - 1 Buyer       →  buyer@markethub.com  / Buyer@1234
 *   - 3 Sample products (linked to categories via N:M)
 *
 * Usage:
 *   node seed.js           — skip existing records
 *   node seed.js --fresh   — wipe everything and re-seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User     = require('./models/User');
const Store    = require('./models/Store');
const Product  = require('./models/Product');
const Category = require('./models/Category');

const FRESH = process.argv.includes('--fresh');

// ── Seed data ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: '💻', description: 'Gadgets, devices and tech accessories' },
  { name: 'Clothing',    slug: 'clothing',    icon: '👕', description: 'Apparel, fashion and accessories' },
  { name: 'Food',        slug: 'food',        icon: '🍎', description: 'Groceries, snacks and beverages' },
  { name: 'Books',       slug: 'books',       icon: '📚', description: 'Books, magazines and educational material' },
  { name: 'Home',        slug: 'home',        icon: '🏠', description: 'Furniture, decor and household items' },
  { name: 'Sports',      slug: 'sports',      icon: '⚽', description: 'Sports equipment and outdoor gear' },
];

const SUPERADMIN = {
  name: 'Super Admin',
  email: 'admin@markethub.com',
  phone: '+1234567890',
  password: 'Admin@1234',
  role: 'superadmin',
};

const SELLER = {
  name: 'Demo Seller',
  email: 'seller@markethub.com',
  phone: '+1234567891',
  password: 'Seller@1234',
  role: 'seller',
};

const BUYER = {
  name: 'Demo Buyer',
  email: 'buyer@markethub.com',
  phone: '+1234567892',
  password: 'Buyer@1234',
  role: 'buyer',
};

// Products reference category slugs for easy lookup
const PRODUCTS = [
  {
    name: 'Wireless Headphones',
    description: 'High quality wireless headphones with noise cancellation.',
    price: 49.99,
    stock: 50,
    unit: 'pcs',
    categorySlugs: ['electronics'],
  },
  {
    name: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt available in multiple colors.',
    price: 19.99,
    stock: 100,
    unit: 'pcs',
    categorySlugs: ['clothing'],
  },
  {
    name: 'Organic Coffee Beans',
    description: 'Premium organic coffee beans sourced from Ethiopia.',
    price: 14.99,
    stock: 200,
    unit: 'bag',
    categorySlugs: ['food'],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`⚠️  ${data.role} already exists — skipping (${data.email})`);
    return existing;
  }
  const hashed = await bcrypt.hash(data.password, 12);
  const user = await User.create({ ...data, password: hashed });
  console.log(`✅ ${data.role} created: ${data.email} / ${data.password}`);
  return user;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  MarketHub Seed Script');
  console.log('   Target: MongoDB Atlas\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  if (FRESH) {
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log('�️  Wiped all collections (--fresh)\n');
  }

  // ── 1. Categories ──────────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const categoryMap = {}; // slug → _id

  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      categoryMap[cat.slug] = existing._id;
      console.log(`   ⚠️  ${cat.name} already exists`);
    } else {
      const created = await Category.create(cat);
      categoryMap[cat.slug] = created._id;
      console.log(`   ✅ ${cat.icon} ${cat.name}`);
    }
  }
  console.log();

  // ── 2. Superadmin ──────────────────────────────────────────────────────────
  console.log('👑 Seeding superadmin...');
  await upsertUser(SUPERADMIN);
  console.log();

  // ── 3. Seller + Store ──────────────────────────────────────────────────────
  console.log('🏪 Seeding seller...');
  let sellerUser = await User.findOne({ email: SELLER.email });
  let store;

  if (sellerUser) {
    console.log(`   ⚠️  Seller already exists (${SELLER.email})`);
    store = await Store.findById(sellerUser.store);
  } else {
    const hashed = await bcrypt.hash(SELLER.password, 12);
    sellerUser = await User.create({ ...SELLER, password: hashed });
    store = await Store.create({
      name: "Demo Seller's Store",
      owner: sellerUser._id,
      description: 'A sample store with demo products.',
      email: SELLER.email,
      phone: SELLER.phone,
    });
    sellerUser.store = store._id;
    await sellerUser.save({ validateModifiedOnly: true });
    console.log(`   ✅ ${SELLER.email} / ${SELLER.password}`);
    console.log(`   🏪 Store: ${store.name}`);
  }
  console.log();

  // ── 4. Buyer ───────────────────────────────────────────────────────────────
  console.log('🛒 Seeding buyer...');
  await upsertUser(BUYER);
  console.log();

  // ── 5. Products ────────────────────────────────────────────────────────────
  if (store) {
    console.log('📦 Seeding products...');
    const existingCount = await Product.countDocuments({ store: store._id });

    if (existingCount > 0) {
      console.log(`   ⚠️  ${existingCount} products already exist for this store — skipping`);
    } else {
      for (const p of PRODUCTS) {
        const { categorySlugs, ...rest } = p;
        const categoryIds = categorySlugs.map((s) => categoryMap[s]).filter(Boolean);
        const primaryCat = CATEGORIES.find((c) => c.slug === categorySlugs[0]);

        await Product.create({
          ...rest,
          store: store._id,
          categories: categoryIds,
          category: primaryCat?.name ?? '',
        });
        console.log(`   ✅ ${p.name} [${categorySlugs.join(', ')}]`);
      }
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('✅ Seed complete! All data is in Atlas.\n');
  console.log('Login credentials:');
  console.log(`  👑 Superadmin : ${SUPERADMIN.email} / ${SUPERADMIN.password}`);
  console.log(`  🏪 Seller     : ${SELLER.email} / ${SELLER.password}`);
  console.log(`  🛒 Buyer      : ${BUYER.email} / ${BUYER.password}`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
