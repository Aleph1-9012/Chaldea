import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defaults } from '../src/customizer/settings';
import { presentation } from '../src/site/catalog';
import { loadRevision, readCatalog } from './export';
import { findWidget, repository, widgetSources, writeThumbnail } from './widget-sources';

// Capture the widget itself when its preview page includes extra space or demo controls.
const frames = new Map<string, { selector: string; viewportWidth: number; padding: number }>([
  ['quick-notes-console', { selector: '#ts-notes-c', viewportWidth: 800, padding: 20 }],
  ['tsugumori', { selector: '#fl-background-panel', viewportWidth: 1024, padding: 0 }],
]);

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

    const { ratio } = presentation(item);
    const width = Math.min(800, 500 * ratio);
    const height = width / ratio;
    // Cover the largest one- and two-column cards at 2x without storing cropped-away pixels.
    const pixelWidth = ratio >= 1.59 ? 2000 : 1320;
    const density = pixelWidth / width;
    const frame = frames.get(item.id);
    const page = await browser.newPage({ viewport: { width: frame?.viewportWidth ?? 800, height: 500 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
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
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done())));
    });

    let clip = { x: (800 - width) / 2, y: (500 - height) / 2, width, height, scale: density };

    if (frame) {
      const bounds = await page.locator(frame.selector).boundingBox();

      if (!bounds || !bounds.width || !bounds.height) throw new Error(`${item.id}: thumbnail frame is not visible.`);

      const frameWidth = Math.max(bounds.width + frame.padding * 2, (bounds.height + frame.padding * 2) * ratio);
      const frameHeight = frameWidth / ratio;
      const x = bounds.x + (bounds.width - frameWidth) / 2;
      const y = bounds.y + (bounds.height - frameHeight) / 2;

      // Keep the full frame on the screenshot surface, including padding above the widget.
      await page.evaluate(({ x, y }) => {
        document.body.style.transform = `translate(${Math.max(0, -x)}px, ${Math.max(0, -y)}px)`;
      }, { x, y });

      clip = { x: Math.max(0, x), y: Math.max(0, y), width: frameWidth, height: frameHeight, scale: pixelWidth / frameWidth };
    } else if (item.category === 'Lockscreens') {
      await page.evaluate(({ width, height }) => {
        const body = document.body;
        const bounds = body.getBoundingClientRect();
        const scale = Math.min(1, width / bounds.width, height / bounds.height);
        body.style.transformOrigin = 'top left';
        body.style.transform = `translate(${(800 - bounds.width * scale) / 2}px, ${(500 - bounds.height * scale) / 2}px) scale(${scale})`;
      }, { width, height });
    }

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 25, g: 27, b: 29, a: 1 } });
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 95, captureBeyondViewport: true, clip });
    const destination = await writeThumbnail(source, Buffer.from(data, 'base64'));

    console.log(`Captured ${relative(repository, destination)}`);
    await page.close();
  }
} finally { await browser.close(); }
