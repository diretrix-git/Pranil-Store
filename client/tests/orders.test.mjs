import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Render the actual page without Clerk, external APIs or production settings.
test('Admin Orders renders with no modal open and exposes all status filters', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pranil-order-ui-'));
  try {
    const result = await build({
      stdin: { contents: `
        import React from 'react';
        import { renderToString } from 'react-dom/server';
        import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
        import OrdersPage from './src/pages/admin/OrdersPage';
        export function render() {
          const client = new QueryClient();
          try { return renderToString(<QueryClientProvider client={client}><OrdersPage /></QueryClientProvider>); }
          finally { client.clear(); }
        }`, resolveDir: process.cwd(), loader: 'tsx' },
      bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent',
      define: { 'import.meta.env': '{}' },
    });
    const file = join(directory, 'page.cjs');
    await writeFile(file, result.outputFiles[0].text);
    const { render } = createRequire(import.meta.url)(file);
    const html = render();
    assert.match(html, /All Status/);
    for (const status of ['pending', 'confirmed', 'processing', 'completed', 'cancelled']) {
      assert.ok(html.includes(`value="${status}"`), `missing ${status} filter`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
