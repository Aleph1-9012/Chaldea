import { beforeAll, beforeEach, afterEach, afterAll } from 'bun:test';
import { chromium } from '@playwright/test';
import type { Browser, Page, BrowserContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
let browser: Browser;
let page: Page;
let context: BrowserContext;
let server: ReturnType<typeof Bun.spawn> | undefined;
const base = 'http://127.0.0.1:5175';
beforeAll(async () => {
  let up = false;
  try { up = (await fetch(`${base}/catalog.json`)).ok; } catch { /* Start the local test server. */ }
  if (!up) {
    server = Bun.spawn([process.execPath, 'run', 'dev'], { cwd: resolve(import.meta.dir, '../..'), stdout: 'ignore', stderr: 'inherit' });
    for (let tries = 0; tries < 100; tries++) {
      try { if ((await fetch(`${base}/catalog.json`)).ok) { up = true; break; } } catch { /* Await startup. */ }
      await Bun.sleep(100);
    }
    if (!up) throw new Error('Test server did not start.');
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
});
beforeEach(async () => {
  context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
});
afterEach(async () => { await context?.close(); });
afterAll(async () => { await browser?.close(); server?.kill(); });
export const browserPage = (): Page => page;
