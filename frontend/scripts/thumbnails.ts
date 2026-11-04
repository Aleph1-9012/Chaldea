import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defaults } from '../src/customizer/settings';
import { presentation } from '../src/site/catalog';
import { loadRevision, readCatalog } from './export';
import { findWidget, repository, widgetSources, writeThumbnail } from './widget-sources';

interface ThumbnailFrame {
  selector: string;
  viewportWidth: number;
  padding: number;
  canvasWidth?: number;
  pixelWidth?: number;
  background?: { r: number; g: number; b: number; a: number };
}

// Capture the widget itself when its preview page includes extra space or demo controls.
const frames = new Map<string, ThumbnailFrame>([
  ['glyphs-branch-grammar', { selector: '.tr-screen', viewportWidth: 800, padding: 0 }],
  ['glyphs-oblique-ligatures', { selector: '.tr-screen', viewportWidth: 800, padding: 0 }],
  ['glyphs-radical-exchange', { selector: '.tr-screen', viewportWidth: 800, padding: 0 }],
  ['quick-notes-console', { selector: '#ts-notes-c', viewportWidth: 800, padding: 20 }],
  ['interactive-art-fish-murmuration', { selector: 'canvas', viewportWidth: 968, padding: 64, background: { r: 3, g: 3, b: 3, a: 1 } }],
  ['interactive-art-sea-turtle', { selector: 'canvas', viewportWidth: 1280, canvasWidth: 1280, pixelWidth: 3200, padding: 0, background: { r: 254, g: 251, b: 244, a: 1 } }],
]);

const local = await readCatalog(resolve(repository, 'build/content'));
const base = process.argv[2] ?? 'http://127.0.0.1:5175/';
const sources = await widgetSources(local.root);
const selectors = process.argv.slice(3);

const selected = (selectors.length ? selectors.map(selector => findWidget(sources, selector)) : sources).map(source => {
  const item = local.catalog.widgets.find(widget => widget.id === source.id);

  if (!item) throw new Error(`Missing packaged widget ${source.id}. Run make content.`);
  if (!/\.(webp|svg)$/.test(source.thumbnailSource)) throw new Error(`${source.id}: thumbnails must declare a WebP or SVG source.`);

  return { source, item };
});

const captures: typeof selected = [];

for (const entry of selected) {
  if (entry.source.thumbnailSource.endsWith('.svg')) {
    console.log(`Preserved vector thumbnail for ${entry.item.id}`);
  } else {
    captures.push(entry);
  }
}

if (!captures.length) process.exit(0);

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });

try {
  for (const { source, item } of captures) {
    const { bundle } = await loadRevision(local.root, item);

    if (!bundle.definition.publicFiles.some(file => file.path === bundle.definition.thumbnail && file.source === source.thumbnailSource)) throw new Error(`${item.id}: thumbnail source index does not match the packaged revision. Run make content.`);

    const { ratio } = presentation(item);
    const width = Math.min(800, 500 * ratio);
    const height = width / ratio;
    const artwork = item.category === 'Interactive art';
    const frame: ThumbnailFrame | undefined = frames.get(item.id) ?? (artwork ? { selector: 'canvas', viewportWidth: 800, padding: 0 } : undefined);
    // Render compact canvases at the capture resolution instead of enlarging their pixels.
    const pixelWidth = frame?.pixelWidth ?? (ratio >= 1.59 ? 2000 : 1320);
    const density = pixelWidth / (frame?.canvasWidth ?? width);
    const page = await browser.newPage({ viewport: { width: frame?.viewportWidth ?? 800, height: 500 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
    const preview = new URL(bundle.definition.preview, new URL('.', new URL(item.bundleUrl, base)));
    await page.goto(preview.href);

    if (frame?.canvasWidth) {
      await page.addStyleTag({ content: `${frame.selector} { width: ${frame.canvasWidth}px; max-width: none; }` });
    }

    await page.evaluate(async ({ settings, artwork }) => {
      const token = crypto.randomUUID();
      await new Promise<void>((done, reject) => {
        const timeout = setTimeout(() => reject(new Error('Preview did not render.')), 6000);
        window.addEventListener('message', event => { if (event.data?.type === 'rendered' && event.data.token === token) { clearTimeout(timeout); done(); } });
        window.postMessage({ channel: 'chaldea:preview', type: 'init', token, externalControls: artwork }, '*');

        // A fresh runtime publishes revision 1 during init. Acknowledge it before
        // settings render so artwork uses the same clean view as the sidebar host.
        if (artwork) window.postMessage({ channel: 'chaldea:preview', type: 'controls-mounted', token, revision: 1 }, '*');

        window.postMessage({ channel: 'chaldea:preview', type: 'settings', token, sequence: 1, settings }, '*');
      });
    }, { settings: defaults(bundle.definition), artwork });
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
    }

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: frame?.background ?? (artwork ? { r: 8, g: 8, b: 8, a: 1 } : { r: 25, g: 27, b: 29, a: 1 }) });
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 95, captureBeyondViewport: true, clip });
    const destination = await writeThumbnail(source, Buffer.from(data, 'base64'));

    console.log(`Captured ${relative(repository, destination)}`);
    await page.close();
  }
} finally { await browser.close(); }
