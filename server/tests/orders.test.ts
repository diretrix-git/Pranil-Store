import { test, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Order from '../models/Order';
import Product from '../models/Product';
import nodemailer from 'nodemailer';
let placeOrder, updateOrderStatus;
let mail: typeof import('../queues/emailQueue');
import * as cache from '../config/redis';

// No application URI, seed, external credentials or Clerk token is used.
const database = `pranil_phase3_test_${new mongoose.Types.ObjectId()}`;
const effects: string[] = [];
const buyer = () => ({ _id: new mongoose.Types.ObjectId(), name: 'Synthetic buyer', email: 'synthetic@example.invalid', phone: '', address: {} });
before(async () => {
  // The existing mailer probes SMTP at module load: stub transport before import.
  mock.method(nodemailer, 'createTransport', () => ({ verify: async () => {}, sendMail: async () => { throw new Error('SMTP is disabled in synthetic tests'); } }));
  mail = await import('../queues/emailQueue');
  mock.method(mail, 'queueEmail', () => { effects.push('email'); });
  mock.method(cache, 'invalidateProductCache', async () => { effects.push('cache'); });
  ({ placeOrder, updateOrderStatus } = await import('../controllers/orders'));
  await mongoose.connect(`mongodb://127.0.0.1:27029/${database}?replicaSet=phase3&directConnection=true`);
  await Promise.all([Cart.init(), Order.init(), Product.init()]);
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); mock.restoreAll(); });
beforeEach(async () => { await Cart.deleteMany({}); await Order.deleteMany({}); await Product.deleteMany({}); effects.length = 0; });
async function product(stock = 1, price = 100) { return Product.create({ name: 'Synthetic product', stock, price, unit: 'pcs' }); }
async function cart(user, products, quantities = products.map(() => 1)) {
  return Cart.create({ buyer: user._id, items: products.map((p, index) => ({ product: p._id, name: p.name, price: p.price, unit: p.unit, quantity: quantities[index] })) });
}
async function call(handler, user, body = {}, params = {}) {
  let status = 200, payload, error;
  const req = { user, body, params, app: { get: () => ({ to: () => ({ emit: () => effects.push('socket') }) }) } };
  const res = { status(code) { status = code; return this; }, json(data) { payload = data; return this; } };
  await handler(req, res, err => { error = err; });
  return { status: error ? error.statusCode ?? 500 : status, payload, error };
}
const checkout = (user, body = {}) => call(placeOrder, user, body);
const transition = (user, id, status) => call(updateOrderStatus, user, { status }, { orderId: String(id) });

test('last item contention: one order, nonnegative stock, losing cart intact', async () => {
  const p = await product(), a = buyer(), b = buyer();
  await cart(a, [p]); await cart(b, [p]);
  const results = await Promise.all([checkout(a), checkout(b)]);
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.equal(results.filter(r => r.status === 409).length, 1);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(p._id))!.stock, 0);
  assert.equal(await Cart.countDocuments({ 'items.0': { $exists: true } }), 1);
  assert.equal(effects.filter(e => e === 'socket').length, 1);
  assert.equal(effects.filter(e => e === 'cache').length, 1);
  assert.equal(effects.filter(e => e === 'email').length, 1);
});
test('mid-checkout server failure rolls back earlier deduction, order and cart', async () => {
  const a = await product(2), b = await product(2), user = buyer();
  const c = await cart(user, [a, b]);
  await mongoose.connection.db!.command({ collMod: Product.collection.name, validator: { $or: [{ _id: { $ne: b._id } }, { stock: { $gte: 2 } }] }, validationLevel: 'strict' });
  try {
    const result = await checkout(user);
    assert.ok(result.error);
    assert.equal((await Product.findById(a._id))!.stock, 2);
    assert.equal((await Product.findById(b._id))!.stock, 2);
    assert.equal(await Order.countDocuments(), 0);
    assert.equal((await Cart.findById(c._id))!.items.length, 2);
    assert.deepEqual(effects, []);
  } finally { await mongoose.connection.db!.command({ collMod: Product.collection.name, validator: {} }); }
});
test('concurrent checkout of one cart consumes it once', async () => {
  const p = await product(20), user = buyer(); await cart(user, [p]);
  const results = await Promise.all(Array.from({ length: 8 }, () => checkout(user)));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(p._id))!.stock, 19);
  assert.equal((await Cart.findOne({ buyer: user._id }))!.items.length, 0);
  assert.equal(effects.filter(e => e === 'socket').length, 1);
  assert.equal(effects.filter(e => e === 'cache').length, 1);
  assert.equal(effects.filter(e => e === 'email').length, 1);
});
test('concurrent different carts with overlapping multi-item stock remain consistent', async () => {
  const p = await product(3), q = await product(3);
  const users = Array.from({ length: 6 }, buyer);
  for (const user of users) await cart(user, [p, q]);
  const results = await Promise.all(users.map(user => checkout(user)));
  assert.equal(results.filter(r => r.status === 201).length, 3);
  assert.equal(await Order.countDocuments(), 3);
  assert.equal((await Product.findById(p._id))!.stock, 0);
  assert.equal((await Product.findById(q._id))!.stock, 0);
});
test('concurrent and sequential double cancellation restores once', async () => {
  const p = await product(4), user = buyer(); await cart(user, [p]);
  const placed = await checkout(user), id = placed.payload.data.order._id;
  const results = await Promise.all(Array.from({ length: 6 }, () => transition(user, id, 'cancelled')));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal((await Product.findById(p._id))!.stock, 4);
  assert.equal((await transition(user, id, 'cancelled')).status, 409);
  assert.equal((await transition(user, id, 'pending')).status, 409);
  assert.equal((await Product.findById(p._id))!.stock, 4);
});
test('only legal forward transitions; completed and cancelled are terminal', async () => {
  const p = await product(4), user = buyer(); await cart(user, [p]);
  const { payload } = await checkout(user), id = payload.data.order._id;
  assert.equal((await transition(user, id, 'completed')).status, 409);
  assert.equal((await transition(user, id, 'confirmed')).status, 200);
  assert.equal((await transition(user, id, 'pending')).status, 409);
  assert.equal((await transition(user, id, 'processing')).status, 200);
  assert.equal((await transition(user, id, 'completed')).status, 200);
  assert.equal((await transition(user, id, 'cancelled')).status, 409);
  assert.equal((await Product.findById(p._id))!.stock, 3);
});
test('confirmation racing cancellation cannot reopen cancelled orders', async () => {
  const p = await product(4), user = buyer(); await cart(user, [p]);
  const { payload } = await checkout(user), id = payload.data.order._id;
  await Promise.all([transition(user, id, 'confirmed'), transition(user, id, 'cancelled')]);
  assert.equal((await Order.findById(id))!.status, 'cancelled');
  assert.equal((await Product.findById(p._id))!.stock, 4);
});
test('partial cancellation failure rolls back earlier restoration and status', async () => {
  const p = await product(3), q = await product(3), user = buyer(); await cart(user, [p, q]);
  const { payload } = await checkout(user), id = payload.data.order._id;
  await Product.deleteOne({ _id: q._id });
  effects.length = 0;
  const result = await transition(user, id, 'cancelled');
  assert.equal(result.status, 409);
  assert.equal((await Order.findById(id))!.status, 'pending');
  assert.equal((await Product.findById(p._id))!.stock, 2);
  assert.deepEqual(effects, []);
});
for (const price of [80, 120]) {
  test(`price change to ${price} rejects stale cart without writes`, async () => {
    const p = await product(3, 100), user = buyer(); const c = await cart(user, [p]);
    await Product.updateOne({ _id: p._id }, { $set: { price } });
    effects.length = 0;
    assert.equal((await checkout(user)).status, 409);
    assert.equal(await Order.countDocuments(), 0);
    assert.equal((await Product.findById(p._id))!.stock, 3);
    assert.equal((await Cart.findById(c._id))!.items[0].price, 100);
    assert.deepEqual(effects, []);
    const refreshed = await Cart.findById(c._id); refreshed!.items[0].price = price; await refreshed!.save();
    const accepted = await checkout(user);
    assert.equal(accepted.status, 201);
    assert.equal(accepted.payload.data.order.totalAmount, price);
  });
}
test('stale cart save cannot repopulate consumed items', async () => {
  const p = await product(3), user = buyer(); const c = await cart(user, [p]);
  const stale = await Cart.findById(c._id);
  assert.equal((await checkout(user)).status, 201);
  stale!.items[0].price = 101;
  await assert.rejects(stale!.save(), /No matching document/);
  assert.equal((await Cart.findById(c._id))!.items.length, 0);
});
test('reviewed cart version mismatch is a conflict and performs no checkout writes', async () => {
  const p = await product(3), user = buyer(); const c = await cart(user, [p]);
  const version = c.get('__v');
  c.items[0].quantity = 2; await c.save();
  const result = await checkout(user, { cartVersion: version });
  assert.equal(result.status, 409);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Product.findById(p._id))!.stock, 3);
});
test('inactive products cannot be ordered from an old cart', async () => {
  const p = await product(), user = buyer(); await cart(user, [p]);
  await Product.updateOne({ _id: p._id }, { $set: { isActive: false } });
  assert.equal((await checkout(user)).status, 409);
  assert.equal(await Order.countDocuments(), 0);
});

test('cart-clear validation failure rolls back all checkout writes', async () => {
  const p = await product(2), user = buyer(); const c = await cart(user, [p]);
  await mongoose.connection.db!.command({ collMod: Cart.collection.name, validator: { 'items.0': { $exists: true } }, validationLevel: 'strict' });
  try {
    const result = await checkout(user);
    assert.ok(result.error);
    assert.equal(await Order.countDocuments(), 0);
    assert.equal((await Product.findById(p._id))!.stock, 2);
    assert.equal((await Cart.findById(c._id))!.items.length, 1);
    assert.deepEqual(effects, []);
  } finally { await mongoose.connection.db!.command({ collMod: Cart.collection.name, validator: {} }); }
});

for (const change of ['price', 'cart']) {
  test(`a concurrent ${change} change during checkout is rejected on transaction retry`, async () => {
    const p = await product(4), user = buyer(); const c = await cart(user, [p]);
    let injected = false;
    const original = Product.updateOne.bind(Product) as (...args: any[]) => any;
    const hook = mock.method(Product, 'updateOne', ((...args: any[]) => (async () => {
      if (!injected) {
        injected = true;
        if (change === 'price') await Product.collection.updateOne({ _id: p._id }, { $set: { price: 120 } });
        else {
          const edited = await Cart.findById(c._id);
          edited!.items[0].quantity = 2;
          await edited!.save();
        }
      }
      return original(...args);
    })()) as typeof Product.updateOne);
    try {
      const result = await checkout(user);
      assert.equal(injected, true);
      assert.equal(result.status, 409);
      assert.equal(await Order.countDocuments(), 0);
      assert.equal((await Product.findById(p._id))!.stock, 4);
      assert.equal((await Cart.findById(c._id))!.items.length, 1);
      assert.deepEqual(effects, []);
    } finally { hook.mock.restore(); }
  });
}
for (const kind of ['cart', 'order']) {
  test(`weakened partial ${kind} index fails closed`, async () => {
    const p = await product(2), user = buyer(); await cart(user, [p]);
    const collection = kind === 'cart' ? Cart.collection : Order.collection;
    const key = kind === 'cart' ? { buyer: 1 as const } : { orderNumber: 1 as const };
    const name = kind === 'cart' ? 'buyer_1' : 'orderNumber_1';
    await collection.dropIndex(name);
    try {
      await collection.createIndex(key, { name, unique: true, partialFilterExpression: { isDeleted: true } });
      const result = await checkout(user);
      assert.equal(result.status, 503);
      assert.equal(await Order.countDocuments(), 0);
      assert.equal((await Product.findById(p._id))!.stock, 2);
      assert.deepEqual(effects, []);
    } finally {
      await collection.dropIndex(name);
      await Cart.createIndexes(); await Order.createIndexes();
    }
  });
}

for (const stage of ['confirmed', 'processing']) {
  test(`cancelling a ${stage} order restores exactly its reserved stock`, async () => {
    const p = await product(4), user = buyer(); await cart(user, [p], [2]);
    const { payload } = await checkout(user), id = payload.data.order._id;
    assert.equal((await transition(user, id, 'confirmed')).status, 200);
    if (stage === 'processing') assert.equal((await transition(user, id, 'processing')).status, 200);
    assert.equal((await transition(user, id, 'cancelled')).status, 200);
    assert.equal((await transition(user, id, 'cancelled')).status, 409);
    assert.equal((await Product.findById(p._id))!.stock, 4);
  });
}
test('storage preparation is repeatable on the disposable replica set', async () => {
  const { execFileSync } = await import('node:child_process');
  for (let attempt = 0; attempt < 2; attempt++) {
    const output = execFileSync(process.execPath, ['-r', 'ts-node/register', 'scripts/prepareOrderStorage.ts'], {
      env: { ...process.env, MONGO_URI: `mongodb://127.0.0.1:27029/${database}?replicaSet=phase3&directConnection=true` },
      encoding: 'utf8', stdio: 'pipe',
    });
    assert.match(output, /Checkout collections and indexes prepared/);
  }
});
