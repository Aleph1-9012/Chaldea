import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defaults } from '../src/customizer/settings';
import { loadRevision, readCatalog } from './export';
import { findWidget, repository, widgetSources, writeThumbnail } from './widget-sources';

const local = await readCatalog(resolve(repository, 'build/content'));
const base = process.argv[2] ?? 'http://127.0.0.1:5175/';
const sources = await widgetSources(local.root);
const selectors = process.argv.slice(3);

const selected = (selectors.length ? selectors.map(selector => findWidget(sources, selector)) : sources).map(source => {
  const item = local.catalog.widgets.find(widget => widget.id === source.id);

  if (!item) throw new Error(`Missing packaged widget ${source.id}. Run make content.`);
  if (!source.thumbnailSource.endsWith('.webp')) throw new Error(`${source.id}: thumbnail capture requires a declared WebP source.`);

  return { source, item };
});

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });

try {
  for (const { source, item } of selected) {
    const { bundle } = await loadRevision(local.root, item);

    if (!bundle.definition.publicFiles.some(file => file.path === bundle.definition.thumbnail && file.source === source.thumbnailSource)) throw new Error(`${item.id}: thumbnail source index does not match the packaged revision. Run make content.`);

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
    const destination = await writeThumbnail(source, Buffer.from(data, 'base64'));

    console.log(`Captured ${relative(repository, destination)}`);
    await page.close();
  }
} finally { await browser.close(); }
