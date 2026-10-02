import { beforeAll, beforeEach, afterEach, afterAll } from 'bun:test';
import { chromium } from '@playwright/test';
import type { Browser, Page, BrowserContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
let browser: Browser;
let page: Page;
let context: BrowserContext;
let server: ViteDevServer | undefined;
let base: string;
beforeAll(async () => {
  console.info('[browser setup] Starting an isolated Vite server');
  server = await createServer({
    root: resolve(import.meta.dir, '../..'),
    server: { host: '127.0.0.1', port: 5176, strictPort: false },
    clearScreen: false,
    logLevel: 'warn',
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port.');
  base = `http://127.0.0.1:${address.port}`;
  console.info(`[browser setup] Vite ready at ${base}`);
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ?? (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  console.info(`[browser setup] Launching ${executablePath ?? 'Playwright Chromium'}`);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'], timeout: 30000 });
  console.info('[browser setup] Chromium ready');
}, 60000);
beforeEach(async () => {
  context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
});
afterEach(async () => { await context?.close(); });
afterAll(async () => {
  try { await browser?.close(); } finally { await server?.close(); }
});
export const browserPage = (): Page => page;
