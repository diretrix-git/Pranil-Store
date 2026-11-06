const assert = require('node:assert/strict');
const { before, after, beforeEach, test } = require('node:test');
const Module = require('node:module');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Stub only external delivery boundaries, before importing the real controllers.
// In particular, do not import mailer.ts: it opens an SMTP connection on import.
const effects = { emails: [], sockets: [], cache: 0, fail: false, hang: false };
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.endsWith('/queues/emailQueue')) return { queueEmail(job) {
    effects.emails.push(job);
    if (effects.fail) throw new Error('Synthetic notification failure');
  } };
  if (request.endsWith('/config/redis')) return { async invalidateProductCache() {
    effects.cache++;
    if (effects.hang) return new Promise(() => {});
    if (effects.fail) throw new Error('Synthetic cache failure');
  } };
  return originalLoad.call(this, request, parent, isMain);
};
const { placeOrder, updateOrderStatus } = require('../controllers/orders');
const { getCart } = require('../controllers/cart');
Module._load = originalLoad;
const Product = require('../models/Product').default;
const Cart = require('../models/Cart').default;
const Order = require('../models/Order').default;

let replicaSet;
before(async () => {
  // No URI/environment input: this harness can only create its own disposable DB.
  replicaSet = await MongoMemoryReplSet.create({
    binary: { version: '7.0.24' },
    replSet: { count: 1, storageEngine: 'wiredTiger', ip: '127.0.0.1',
      args: ['--nounixsocket', '--setParameter', 'diagnosticDataCollectionEnabled=false'] },
  });
  await mongoose.connect(replicaSet.getUri(), { dbName: 'synthetic_order_regressions' });
  await Promise.all([Product.init(), Cart.init(), Order.init()]);
});
after(async () => {
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});
beforeEach(async () => {
  await mongoose.connection.db.command({ collMod: Product.collection.collectionName, validator: {} });
  await Promise.all([Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
  effects.emails = []; effects.sockets = []; effects.cache = 0; effects.fail = false; effects.hang = false;
});

function buyer() {
  return { _id: new mongoose.Types.ObjectId(), name: 'Synthetic Buyer',
    email: 'buyer@example.invalid', phone: '0000000000', address: {} };
}
async function product(stock = 10, price = 25) {
  return Product.create({ name: 'Synthetic Product', stock, price, unit: 'pcs' });
}
async function cart(user, products, quantity = 1) {
  return Cart.create({ buyer: user._id, items: products.map(p => ({
    product: p._id, name: p.name, price: p.price, unit: p.unit, quantity,
  })) });
}
async function invoke(controller, user, body = {}, params = {}) {
  if (controller === placeOrder && !Object.hasOwn(body, 'cartVersion')) {
    const current = await Cart.findOne({ buyer: user._id });
    body = { ...body, cartVersion: current?.__v ?? 0 };
  }
  let status, payload, error;
  const req = { user, body, params, app: { get() { return { to() { return { emit(name, data) {
    effects.sockets.push({ name, data });
    if (effects.fail) throw new Error('Synthetic socket failure');
  } }; } }; } } };
  const res = { status(code) { status = code; return this; }, json(value) { payload = value; return this; } };
  await controller(req, res, err => { error = err; });
  return { status, payload, error };
}
const checkout = user => invoke(placeOrder, user);
const changeStatus = (id, status) => invoke(updateOrderStatus, buyer(), { status }, { orderId: String(id) });
const stock = async p => (await Product.findById(p._id)).stock;
function conflict(result) { assert.equal(result.error?.statusCode, 409, result.error?.stack); }
async function placed(products, quantity = 1) {
  const user = buyer(); await cart(user, products, quantity);
  const result = await checkout(user);
  assert.equal(result.status, 201, result.error?.stack);
  return result.payload.data.order;
}
async function rejectStockChange(p, originalStock) {
  // Real database validation error on one selected product, not a mocked DB write.
  await mongoose.connection.db.command({ collMod: Product.collection.collectionName,
    validator: { $or: [{ _id: { $ne: p._id } }, { stock: originalStock }] },
    validationLevel: 'strict', validationAction: 'error' });
}

test('multi-item checkout commits order, all deductions and cart clearing together', async () => {
  const products = [await product(), await product(8, 50)];
  const user = buyer(); await cart(user, products, 2);
  const r = await invoke(placeOrder, user, { notes: 'Synthetic notes', totalAmount: 1, price: 1 });
  assert.equal(r.status, 201, r.error?.stack);
  assert.equal(r.payload.data.order.totalAmount, 150);
  assert.equal(r.payload.data.order.notes, 'Synthetic notes');
  assert.equal(r.payload.data.order.inventoryState, 'reserved');
  assert.deepEqual(await Promise.all(products.map(stock)), [8, 6]);
  const cleared = await Cart.findOne({ buyer: user._id });
  assert.equal(cleared.items.length, 0); assert.equal(cleared.totalAmount, 0);
  assert.equal(effects.emails.length, 1); assert.equal(effects.sockets.length, 1);
  assert.equal(effects.cache, 1);
});

test('last-item contention commits one order and leaves losing cart intact', async () => {
  const p = await product(1); const users = [buyer(), buyer()];
  await Promise.all(users.map(u => cart(u, [p])));
  const results = await Promise.all(users.map(checkout));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  conflict(results.find(r => r.status !== 201));
  assert.equal(await Order.countDocuments(), 1); assert.equal(await stock(p), 0);
  assert.equal((await Cart.findOne({ buyer: users[results.findIndex(r => r.status !== 201)]._id })).items.length, 1);
  assert.equal(effects.emails.length, 1); assert.equal(effects.sockets.length, 1);
});

test('database failure on second deduction rolls back order, earlier stock and cart', async () => {
  const products = [await product(5), await product(5)];
  const user = buyer(); await cart(user, products);
  await rejectStockChange(products[1], 5);
  const r = await checkout(user); assert.ok(r.error); assert.equal(r.error.code, 121);
  assert.equal(await Order.countDocuments(), 0);
  assert.deepEqual(await Promise.all(products.map(stock)), [5, 5]);
  assert.equal((await Cart.findOne({ buyer: user._id })).items.length, 2);
  assert.equal(effects.emails.length, 0); assert.equal(effects.sockets.length, 0); assert.equal(effects.cache, 0);
});

test('concurrent buyers cannot oversell shared stock', async () => {
  const p = await product(3); const users = Array.from({ length: 8 }, buyer);
  await Promise.all(users.map(u => cart(u, [p])));
  const results = await Promise.all(users.map(checkout));
  assert.equal(results.filter(r => r.status === 201).length, 3);
  results.filter(r => r.status !== 201).forEach(conflict);
  assert.equal(await stock(p), 0); assert.equal(await Order.countDocuments(), 3);
  assert.equal(effects.emails.length, 3);
});

test('concurrent checkout of the same cart consumes it once', async () => {
  const p = await product(); const user = buyer(); await cart(user, [p], 2);
  const results = await Promise.all([checkout(user), checkout(user), checkout(user)]);
  assert.equal(results.filter(r => r.status === 201).length, 1);
  results.filter(r => r.status !== 201).forEach(r => assert.equal(r.error?.statusCode, 400));
  assert.equal(await Order.countDocuments(), 1); assert.equal(await stock(p), 8);
  assert.equal(effects.emails.length, 1);
  const repeated = await checkout(user); assert.equal(repeated.error?.statusCode, 400);
});

test('concurrent and repeated cancellation restores every line exactly once', async () => {
  const products = [await product(), await product()]; const order = await placed(products, 2);
  effects.emails = []; effects.cache = 0;
  const results = await Promise.all([changeStatus(order._id, 'cancelled'), changeStatus(order._id, 'cancelled')]);
  results.forEach(r => assert.equal(r.status, 200, r.error?.stack));
  assert.equal((await changeStatus(order._id, 'cancelled')).status, 200);
  assert.deepEqual(await Promise.all(products.map(stock)), [10, 10]);
  const saved = await Order.findById(order._id);
  assert.equal(saved.status, 'cancelled'); assert.equal(saved.inventoryState, 'restored');
  assert.equal(effects.emails.length, 1); assert.equal(effects.cache, 1);
});

test('cancellation failure rolls back status and all restorations', async () => {
  const products = [await product(), await product()]; const order = await placed(products);
  effects.emails = []; effects.cache = 0;
  await rejectStockChange(products[1], 9);
  assert.ok((await changeStatus(order._id, 'cancelled')).error);
  assert.equal((await Order.findById(order._id)).status, 'pending');
  assert.deepEqual(await Promise.all(products.map(stock)), [9, 9]);
  assert.equal(effects.emails.length, 0); assert.equal(effects.cache, 0);
});

test('cancelled orders cannot reopen or restore stock a second time', async () => {
  const p = await product(); const order = await placed([p]);
  assert.equal((await changeStatus(order._id, 'cancelled')).status, 200);
  conflict(await changeStatus(order._id, 'pending'));
  assert.equal((await changeStatus(order._id, 'cancelled')).status, 200);
  assert.equal(await stock(p), 10);
});

const statuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
const legal = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'], completed: [], cancelled: [] };
test('all 25 status pairs enforce the transition graph and same-state idempotence', async () => {
  for (const from of statuses) for (const to of statuses) {
    const p = await product(); const order = await placed([p]);
    await Order.updateOne({ _id: order._id }, { $set: {
      status: from, inventoryState: from === 'cancelled' ? 'restored' : 'reserved',
    } });
    if (from === 'cancelled') await Product.updateOne({ _id: p._id }, { $inc: { stock: 1 } });
    const r = await changeStatus(order._id, to);
    const allowed = from === to || legal[from].includes(to);
    if (allowed) assert.equal(r.status, 200, `${from}->${to}: ${r.error?.stack}`);
    else conflict(r);
    assert.equal((await Order.findById(order._id)).status, allowed ? to : from);
    assert.equal(await stock(p), from === 'cancelled' || (allowed && to === 'cancelled') ? 10 : 9);
  }
});

test('price increases and decreases reject stale carts until refresh and confirmation', async () => {
  for (const price of [40, 10]) {
    const p = await product(10, 25); const user = buyer(); await cart(user, [p]);
    await Product.updateOne({ _id: p._id }, { $set: { price } });
    conflict(await checkout(user));
    assert.equal(await Order.countDocuments({ buyer: user._id }), 0); assert.equal(await stock(p), 10);
    const refreshed = await invoke(getCart, user);
    assert.equal(refreshed.payload.data.priceChanged, true);
    assert.equal(refreshed.payload.data.cart.totalAmount, price);
    const r = await checkout(user); assert.equal(r.status, 201, r.error?.stack);
    assert.equal(r.payload.data.order.totalAmount, price);
  }
});

test('inactive, deleted or missing products reject checkout without partial writes', async () => {
  for (const mode of ['inactive', 'deleted', 'missing']) {
    const p = await product(); const user = buyer(); await cart(user, [p]);
    if (mode === 'missing') await Product.deleteOne({ _id: p._id });
    else await Product.updateOne({ _id: p._id }, { $set: mode === 'inactive' ? { isActive: false } : { isDeleted: true } });
    conflict(await checkout(user));
    assert.equal(await Order.countDocuments({ buyer: user._id }), 0);
    assert.equal((await Cart.findOne({ buyer: user._id })).items.length, 1);
    if (mode !== 'missing') assert.equal(await stock(p), 10);
  }
});

test('malformed stored quantities cannot increase stock or create an order', async () => {
  for (const quantity of [-1, 0, 1.5]) {
    const p = await product(); const user = buyer(); const c = await cart(user, [p]);
    await Cart.collection.updateOne({ _id: c._id }, { $set: { 'items.0.quantity': quantity } });
    assert.equal((await checkout(user)).error?.statusCode, 400);
    assert.equal(await stock(p), 10); assert.equal(await Order.countDocuments({ buyer: user._id }), 0);
  }
});

test('missing restoration target aborts cancellation rather than losing stock history', async () => {
  const p = await product(); const order = await placed([p]); await Product.deleteOne({ _id: p._id });
  conflict(await changeStatus(order._id, 'cancelled'));
  assert.equal((await Order.findById(order._id)).status, 'pending');
});

test('legacy orders require inventory reconciliation before cancellation', async () => {
  const p = await product(); const order = await placed([p]);
  await Order.collection.updateOne({ _id: order._id }, { $unset: { inventoryState: '' } });
  conflict(await changeStatus(order._id, 'cancelled'));
  assert.equal((await Order.findById(order._id)).status, 'pending'); assert.equal(await stock(p), 9);
});

test('post-commit delivery failures do not report a committed checkout as failed', async () => {
  const p = await product(); const user = buyer(); await cart(user, [p]); effects.fail = true;
  const r = await checkout(user); assert.equal(r.status, 201, r.error?.stack);
  assert.equal(await Order.countDocuments(), 1); assert.equal(await stock(p), 9);
  assert.equal(effects.emails.length, 1); assert.equal(effects.sockets.length, 1); assert.equal(effects.cache, 1);
});

test('a price refresh on another device cannot silently change a confirmed cart', async () => {
  const p = await product(); const user = buyer(); const c = await cart(user, [p]);
  const confirmedVersion = c.__v;
  await Product.updateOne({ _id: p._id }, { $set: { price: 75 } });
  await invoke(getCart, user); // Another device refreshed the persisted cart price.
  conflict(await invoke(placeOrder, user, { cartVersion: confirmedVersion }));
  assert.equal(await Order.countDocuments(), 0); assert.equal(await stock(p), 10);
});

test('stale cart saves cannot resurrect items after checkout', async () => {
  const p = await product(); const user = buyer(); await cart(user, [p]);
  const stale = await Cart.findOne({ buyer: user._id });
  assert.equal((await checkout(user)).status, 201);
  stale.items[0].quantity = 3;
  await assert.rejects(stale.save(), { name: 'VersionError' });
  assert.equal((await Cart.findOne({ buyer: user._id })).items.length, 0);
  assert.equal(await stock(p), 9);
});

test('checkout requires the cart revision that the buyer reviewed', async () => {
  const p = await product(); const user = buyer(); await cart(user, [p]);
  for (const cartVersion of [undefined, -1, 1.5, '0']) {
    assert.equal((await invoke(placeOrder, user, { cartVersion })).error?.statusCode, 400);
  }
  assert.equal(await Order.countDocuments(), 0); assert.equal(await stock(p), 10);
});

test('price write racing a deduction aborts/retries without charging a stale price', async () => {
  const p = await product(); const user = buyer(); await cart(user, [p]);
  const original = Product.updateOne;
  let changed = false;
  Product.updateOne = async function (filter, update, options) {
    if (options?.session && filter.stock && !changed) {
      changed = true;
      await Product.collection.updateOne({ _id: p._id }, { $set: { price: 99 } });
    }
    return original.call(this, filter, update, options);
  };
  try { conflict(await checkout(user)); }
  finally { Product.updateOne = original; }
  assert.equal(changed, true);
  assert.equal(await stock(p), 10); assert.equal(await Order.countDocuments(), 0);
  assert.equal(effects.emails.length, 0);
});

test('a stalled cache cannot stall the committed order response or notifications', { timeout: 3000 }, async () => {
  const p = await product(); const user = buyer(); await cart(user, [p]); effects.hang = true;
  const r = await checkout(user);
  assert.equal(r.status, 201, r.error?.stack);
  assert.equal(await Order.countDocuments(), 1); assert.equal(await stock(p), 9);
  assert.equal(effects.emails.length, 1); assert.equal(effects.sockets.length, 1);
});
