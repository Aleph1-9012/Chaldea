import { test } from 'bun:test';
import { expect, type Page } from '@playwright/test';
import { browserPage } from './setup';
import archive from '../../../docs/archive-imports.json';
import { resolve } from 'node:path';
import { loadLocal } from '../../scripts/export';
import { includesWidget } from './selection';

async function open(page: Page, id: string) {
  await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  return page.frameLocator('iframe');
}

export function registerArchiveTests() {
  const selected = archive.entries.filter(entry => includesWidget(entry.id));
  // Exercise every independent imported document through the real opaque iframe.
  for (let offset = 0; offset < selected.length; offset += 8) {
    const entries = selected.slice(offset, offset + 8);
    test(`archive ${offset + 1}–${offset + entries.length}: isolated previews, settings, and responsive layout`, async () => {
      const page = browserPage(); const failures: string[] = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
      page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') failures.push(`Remote request: ${request.url()}`); });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const entry of entries) {
        await page.setViewportSize({ width: 1440, height: 1000 });
        const frame = await open(page, entry.id);
        const { bundle: { definition } } = await loadLocal(resolve(import.meta.dirname, '../../../build/content'), entry.id);
        if (definition.status === 'draft') await expect(frame.locator('html')).toHaveAttribute('data-archive-ready', 'true');
        await expect(page.locator('.code-panel')).toHaveCount(definition.exports.some((file: { kind: string }) => file.kind === 'template') ? 1 : 0);
        for (const selector of entry.selection.remove ?? []) await expect(frame.locator(selector)).toHaveCount(0);
        // Original appearance controls round-trip through the parent handshake.
        const setting = definition.settings.find((item: {type: string}) => item.type === 'boolean' || item.type === 'enum');
        if (setting) {
          const control = page.locator(`#setting-${setting.key}`);
          if (setting.type === 'boolean') await control.setChecked(!setting.default);
          else if (setting.type === 'enum') await control.selectOption(setting.choices.find(choice => choice !== setting.default) ?? setting.default);
          await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
          await expect(page.locator('.preview-error')).toHaveCount(0);
          await page.getByRole('button', { name: 'Reset', exact: true }).click();
        }
        if (entry.source.startsWith('player/')) {
          const play = frame.locator('[data-action="play"]:visible, [data-play]:visible').first();
          const before = await play.textContent(); await play.click();
          await expect.poll(() => play.textContent()).not.toBe(before);
          const next = frame.locator('[data-action="next"]:visible, [data-next]:visible').first();
          const text = await frame.locator('body').innerText(); await next.click();
          await expect.poll(() => frame.locator('body').innerText()).not.toBe(text);
        } else if (entry.source.startsWith('clipboard/')) {
          const search = frame.locator('input[type="search"]:visible, input[placeholder*="earch"]:visible').first();
          if (await search.count()) {
            const before = await frame.locator('body').innerText();
            await search.fill('xlr8-no-matching-entry');
            await expect.poll(() => frame.locator('body').innerText()).not.toBe(before);
            await search.fill('');
          }
        } else if (entry.source.startsWith('quick-notes/')) {
          const add = frame.getByRole('button', { name: /NEW/ }).first(); await add.click();
          const editor = frame.locator('textarea:visible').first(); await editor.fill('XLR8 session note');
          await expect(editor).toHaveValue('XLR8 session note');
        } else if (entry.source.startsWith('lockscreen/')) {
          const input = frame.locator('input[type="password"]:visible').first();
          if (await input.count()) { await input.fill('demo'); await expect.poll(() => input.inputValue()).not.toBe(''); await input.press('Escape'); }
        }
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          await expect.poll(() => frame.locator('body').evaluate(() => ({
            width: document.documentElement.scrollWidth <= innerWidth + 1,
            height: document.documentElement.scrollHeight <= innerHeight + 1,
          })), { message: entry.id }).toEqual({ width: true, height: true });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        }
        expect(failures, entry.id).toEqual([]);
      }
    });
  }
  if (includesWidget('notes-notes-a-cassette')) test('archive notes reset after switching widgets', async () => {
    const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
    let frame = await open(page, 'notes-notes-a-cassette');
    const palette = page.getByLabel('Palette', { exact: true }); await palette.selectOption('Red');
    await expect(frame.locator('#ts-notes-a')).toHaveAttribute('data-palette', 'Red');
    await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    await frame.locator('textarea').fill('temporary archive note');
    await open(page, 'player-directions-matrix');
    frame = await open(page, 'notes-notes-a-cassette'); await expect(frame.locator('textarea')).not.toHaveValue('temporary archive note');
  });
}
