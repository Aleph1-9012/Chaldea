import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertCatalog } from '../src/catalog/contracts';
import { defaults } from '../src/customizer/settings';
import { loadLocal } from './export';
import { findWidget, widgetSources } from './widget-sources';
const root = resolve(import.meta.dir, '../..');
const catalog: unknown = JSON.parse(await readFile(resolve(root, 'build/content/catalog.json'), 'utf8')); assertCatalog(catalog);
const base = process.argv[2] ?? 'http://127.0.0.1:5175/';
const sources = await widgetSources();
const ids = process.argv.slice(3).map(selector => findWidget(sources, selector).id);
if (ids.some(id => !catalog.widgets.some(item => item.id === id))) throw new Error('Unknown widget ID.');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
try {
  for (const item of catalog.widgets) {
    if (ids.length && !ids.includes(item.id)) continue;
    const { bundle } = await loadLocal(resolve(root, 'build/content'), item.id);
    const page = await browser.newPage({ viewport: { width: 800, height: 500 }, reducedMotion: 'reduce' });
    const preview = new URL(bundle.definition.preview, new URL('.', new URL(item.bundleUrl, base)));
    await page.goto(preview.href);
    await page.evaluate(async settings => {
      const token = crypto.randomUUID();
      await new Promise<void>((done, reject) => {
        const timeout = setTimeout(() => reject(new Error('Preview did not render.')), 6000);
        window.addEventListener('message', event => { if (event.data?.type === 'rendered' && event.data.token === token) { clearTimeout(timeout); done(); } });
        window.postMessage({ channel: 'chaldea:preview', type: 'init', token }, '*');
        window.postMessage({ channel: 'chaldea:preview', type: 'settings', token, sequence: 1, settings }, '*');
      });
    }, defaults(bundle.definition));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 25, g: 27, b: 29, a: 1 } });
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 88, clip: { x: 0, y: 0, width: 800, height: 500, scale: 0.8 } });
    const source = findWidget(sources, item.id);
    await writeFile(resolve(source.dir, 'thumbnail.webp'), Buffer.from(data, 'base64'));
    console.log(`Captured widgets/${source.path}/thumbnail.webp`); await page.close();
  }
} finally { await browser.close(); }
