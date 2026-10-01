import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { bundle, files, summary } from '../fixture';

const runtime = await readFile(new URL('../../src/preview/runtime.js', import.meta.url), 'utf8');
export async function withContractFixture(page: Page) {
  await page.route('**/catalog.json', async route => {
    const response = await route.fetch();
    const catalog = await response.json();
    catalog.widgets.push(summary);
    await route.fulfill({ json: catalog });
  });
  await page.route('**/revisions/contract-fixture/**', async route => {
    const path = new URL(route.request().url()).pathname.split(`${summary.revision}/`)[1]!;
    if (path === 'bundle.json') { await route.fulfill({ json: bundle }); return; }
    const body = path === 'preview-runtime.js' ? runtime : files[path.replace(/^files\//, '')];
    if (body === undefined) { await route.fulfill({ status: 404 }); return; }
    const contentType = path.endsWith('.html') ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/plain';
    await route.fulfill({ body, contentType });
  });
}
