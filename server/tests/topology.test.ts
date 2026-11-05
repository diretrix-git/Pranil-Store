import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Order from '../models/Order';
import Product from '../models/Product';
import { checkoutCart } from '../services/orderTransactions';

const database = `pranil_phase3_test_${new mongoose.Types.ObjectId()}`;
const uri = `mongodb://127.0.0.1:27030/${database}?directConnection=true`;
before(async () => {
  await mongoose.connect(uri);
  await Promise.all([Cart.init(), Order.init(), Product.init()]);
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
test('standalone MongoDB rejects checkout without business writes', async () => {
  const p = await Product.create({ name: 'Synthetic product', stock: 3, price: 100 });
  const user = { _id: new mongoose.Types.ObjectId(), name: 'Synthetic', email: 'synthetic@example.invalid' };
  const c = await Cart.create({ buyer: user._id, items: [{ product: p._id, price: p.price, quantity: 1, name: p.name }] });
  await assert.rejects(checkoutCart(user), /Transaction numbers are only allowed/);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Product.findById(p._id))!.stock, 3);
  assert.equal((await Cart.findById(c._id))!.items.length, 1);
});
test('storage preparation rejects unsupported standalone topology explicitly', () => {
  assert.throws(() => execFileSync(process.execPath, ['-r', 'ts-node/register', 'scripts/prepareOrderStorage.ts'], {
    env: { ...process.env, MONGO_URI: uri }, encoding: 'utf8', stdio: 'pipe',
  }), /Checkout requires a MongoDB replica set/);
});
