const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('../../server/node_modules/typescript');

// Run the real pure client helper through the existing server TypeScript
// compiler. No browser framework or additional runtime dependency is needed.
function helper() {
  const filename = path.resolve(__dirname, '../src/utils/checkout.ts');
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const loaded = new Module(filename, module);
  loaded._compile(result.outputText, filename);
  return loaded.exports;
}
const freshCart = () => ({ __v: 7, totalAmount: 60, items: [
  { product: 'synthetic-product', name: 'Synthetic Product', price: 30, quantity: 2, unit: 'pcs' },
] });

test('checkout preparation serializes cart saves before fetching confirmation', async () => {
  const events = []; let active = false;
  const confirmation = await helper().prepareCheckout({ first: 2, second: 3 }, async id => {
    assert.equal(active, false, 'cart writes must not overlap'); active = true;
    events.push(`start:${id}`); await new Promise(resolve => setImmediate(resolve));
    events.push(`end:${id}`); active = false;
  }, async () => { assert.equal(active, false); events.push('fetch'); return freshCart(); });
  assert.deepEqual(events, ['start:first', 'end:first', 'start:second', 'end:second', 'fetch']);
  assert.equal(confirmation.cartVersion, 7);
});

test('confirmation uses a frozen server snapshot, unaffected by later refetches or drafts', async () => {
  const serverCart = freshCart(); const draft = { 'synthetic-product': 4 };
  const confirmation = await helper().prepareCheckout(draft, async () => {}, async () => serverCart);
  // Server rejected/normalized an edit: confirm its actual quantity and total.
  assert.equal(confirmation.items[0].quantity, 2); assert.equal(confirmation.totalAmount, 60);
  draft['synthetic-product'] = 8;
  serverCart.__v = 8; serverCart.items[0].price = 90; serverCart.items[0].quantity = 3;
  assert.equal(confirmation.cartVersion, 7);
  assert.equal(confirmation.items[0].price, 30); assert.equal(confirmation.items[0].quantity, 2);
});

test('invalid drafts and failed saves cannot open a confirmation', async () => {
  let saves = 0, fetches = 0;
  for (const quantity of [0, -1, 1.5, 501, '']) {
    await assert.rejects(helper().prepareCheckout({ good: 2, bad: quantity },
      async () => { saves++; }, async () => { fetches++; return freshCart(); }));
  }
  assert.equal(saves, 0); assert.equal(fetches, 0);
  await assert.rejects(helper().prepareCheckout({ first: 2, second: 3 },
    async () => { throw new Error('Synthetic save failure'); }, async () => { fetches++; return freshCart(); }));
  assert.equal(fetches, 0);
});

test('failed cart refresh cannot confirm stale cached data', async () => {
  await assert.rejects(helper().prepareCheckout({}, async () => {}, async () => {
    throw new Error('Synthetic fetch failure');
  }), /Synthetic fetch failure/);
});
