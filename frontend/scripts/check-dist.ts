import { chromium, expect } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { assertCatalog } from '../src/catalog/contracts';
const dist = resolve(import.meta.dir, '../../dist');
for (const name of ['LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_LICENSES.txt']) {
  if (!existsSync(resolve(dist, name))) throw new Error(`Missing distribution notice: ${name}`);
}
const catalog: unknown = await Bun.file(resolve(dist, 'catalog.json')).json(); assertCatalog(catalog);
if (catalog.widgets.some(w => w.status !== 'published')) throw new Error('Draft leaked into production.');
const revisions = resolve(dist, 'revisions');
const published = new Set(catalog.widgets.map(widget => widget.id));
if (existsSync(revisions) && readdirSync(revisions).some(id => !published.has(id))) throw new Error('Unpublished widget files leaked into production.');
// Exercise the built files under a subpath as well as query-based selection.
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
  const path = decodeURIComponent(new URL(request.url).pathname);
  if (!path.startsWith('/library/')) return new Response('Not found', { status: 404 });
  const file = resolve(dist, path.slice('/library/'.length) || 'index.html');
  if (!file.startsWith(`${dist}${sep}`)) return new Response('Not found', { status: 404 });
  return new Response(Bun.file(file));
} });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
try {
  const page = await browser.newPage(); const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.port}/library/`);
  if (!catalog.widgets.length) await expect(page.getByText('No widgets published yet.', { exact: false })).toBeVisible();
  for (const widget of catalog.widgets) {
    await page.goto(`http://127.0.0.1:${server.port}/library/?widget=${widget.id}`);
    await expect(page.getByRole('heading', { name: widget.title, exact: true })).toBeVisible();
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toBeEnabled();
    await page.reload(); await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  }
  expect(errors).toEqual([]);
  console.log(catalog.widgets.length
    ? `Production smoke passed: ${catalog.widgets.length} published widgets, subpath loads, query reloads, and no drafts.`
    : 'Production smoke passed: empty published catalog, subpath loads, license notices, and no drafts.');
} finally { await browser.close(); server.stop(); }
