import { test } from 'bun:test';
import { expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { unzipSync } from 'fflate';
import { browserPage } from './setup';
import { loadLocal } from '../../scripts/export';
import { defaults } from '../../src/customizer/settings';
import { generate } from '../../src/generator';

const ids = ['a-cassette', 'b-index', 'c-console', 'd-ash', 'numbered', 'preview', 'refined'].map(name => `notes-notes-${name}`);
export function registerQuickNotesTests() {
  test('notes-notes-refined: new-note placement preserves existing order, editing, and Undo', async () => {
    const page = browserPage();
    await page.goto('/?widget=notes-notes-refined');
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('iframe');
    const body = frame.getByRole('textbox', { name: 'Note contents', exact: true });
    const title = frame.getByRole('textbox', { name: 'Note title', exact: true });
    const rows = frame.locator('.tn-note');
    await page.getByLabel('Show note numbers', { exact: true }).uncheck();
    await body.fill('Keep my current note');
    await body.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(4, 4));
    await page.getByLabel('New note position', { exact: true }).selectOption('Top');
    await expect(rows).toHaveText(['Before I leave', 'Useful commands']);
    await expect(rows.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(body).toHaveValue('Keep my current note');
    expect(await body.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(4);
    await frame.getByRole('button', { name: 'Delete Useful commands', exact: true }).click();
    await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    await expect(title).toBeFocused();
    await title.fill('Front note'); await body.fill('New at the top');
    await frame.getByRole('button', { name: 'UNDO', exact: true }).click();
    await expect(rows).toHaveText(['Front note', 'Before I leave', 'Useful commands']);
    await expect(body).toHaveValue('hyprctl monitors\nwpctl status');
    await rows.nth(1).click(); await expect(body).toHaveValue('Keep my current note');
    await page.getByLabel('New note position', { exact: true }).selectOption('Bottom');
    await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    await expect(title).toBeFocused(); await title.fill('Last note');
    await expect(rows).toHaveText(['Front note', 'Before I leave', 'Useful commands', 'Last note']);
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(title).toHaveValue('Last note');
    await expect(page.getByLabel('New note position', { exact: true })).toHaveValue('Bottom');
    await expect(rows).toHaveText(['01// Front note', '02// Before I leave', '03// Useful commands', '04// Last note']);
    await expect(page.locator('.preview-error')).toHaveCount(0);
  });

  test('notes-notes-refined: list height keeps the active note reachable at both ends', async () => {
    const page = browserPage();
    await page.goto('/?widget=notes-notes-refined');
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('iframe');
    const list = frame.locator('.tn-index');
    const body = frame.getByRole('textbox', { name: 'Note contents', exact: true });
    for (let i = 0; i < 10; i++) await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    await body.fill('Keep the selected note');
    const selectedVisible = () => list.evaluate(element => {
      const row = element.querySelector<HTMLElement>('[data-selected="true"]')!;
      return row.offsetTop >= element.scrollTop - 1 && row.offsetTop + row.offsetHeight <= element.scrollTop + element.clientHeight + 1;
    });
    for (const density of ['Compact', 'Comfortable', 'Spacious']) {
      await page.getByLabel('Note list spacing', { exact: true }).selectOption(density);
      await page.getByLabel('Visible note rows value', { exact: true }).fill('2');
      await expect.poll(selectedVisible).toBe(true);
      const shortHeight = await list.evaluate(element => element.clientHeight);
      await page.getByLabel('Visible note rows value', { exact: true }).fill('8');
      await expect.poll(() => list.evaluate(element => element.clientHeight)).toBeGreaterThan(shortHeight);
      await expect.poll(selectedVisible).toBe(true);
      await expect(body).toHaveValue('Keep the selected note');
    }
    await page.getByLabel('New note position', { exact: true }).selectOption('Top');
    await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    await expect.poll(selectedVisible).toBe(true);
    await expect(frame.locator('.tn-note').first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Visible note rows value', { exact: true }).fill('2');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(selectedVisible).toBe(true);
    await expect.poll(() => frame.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const directory = resolve(import.meta.dir, '../../../build/evidence/quick-notes');
    await mkdir(directory, { recursive: true });
    await frame.locator('#ts-notes-refined').screenshot({ path: resolve(directory, 'refined-workflow-mobile.png') });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.getByLabel('Visible note rows value', { exact: true })).toHaveValue('4');
    await expect.poll(selectedVisible).toBe(true);
    await expect(page.locator('.preview-error')).toHaveCount(0);
  });

  test('notes-notes-refined: reading controls preserve editing, Unicode counts, and Undo', async () => {
    const page = browserPage();
    await page.goto('/?widget=notes-notes-refined');
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('iframe');
    const body = frame.getByRole('textbox', { name: 'Note contents', exact: true });
    const title = frame.getByRole('textbox', { name: 'Note title', exact: true });
    const count = frame.locator('[data-text-count]');
    await body.fill('one two\n継衛🙂');
    await body.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(3, 3));
    await page.getByLabel('Writing area height value', { exact: true }).fill('280');
    await page.getByLabel('Title size value', { exact: true }).fill('24');
    await page.getByLabel('Note list spacing', { exact: true }).selectOption('Compact');
    await page.getByLabel('Text count', { exact: true }).selectOption('Words');
    await page.getByLabel('Show note numbers', { exact: true }).uncheck();
    await expect(body).toHaveCSS('height', '280px');
    await expect(title).toHaveCSS('font-size', '24px');
    await expect(count).toHaveText('3 words');
    await expect(frame.locator('.tn-note').first()).toHaveText('Before I leave');
    await expect(body).toHaveValue('one two\n継衛🙂');
    expect(await body.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(3);
    await page.getByLabel('Text count', { exact: true }).selectOption('Characters');
    await expect(count).toHaveText('11 characters');
    await body.fill('  '); await expect(count).toHaveText('2 characters');
    await page.getByLabel('Text count', { exact: true }).selectOption('Words');
    await expect(count).toHaveText('0 words');
    await body.fill('one two\n継衛🙂');
    await frame.locator('.tn-note').nth(1).click();
    await frame.locator('.tn-note').first().click();
    await expect(body).toHaveValue('one two\n継衛🙂');
    await frame.getByRole('button', { name: 'Delete Before I leave', exact: true }).click();
    await page.getByLabel('Note list spacing', { exact: true }).selectOption('Spacious');
    await frame.getByRole('button', { name: 'UNDO', exact: true }).click();
    await expect(body).toHaveValue('one two\n継衛🙂');
    await expect(count).toHaveText('3 words');
    for (let i = 0; i < 12; i++) await frame.getByRole('button', { name: '+ NEW NOTE', exact: true }).click();
    const list = frame.locator('.tn-index');
    for (const density of ['Compact', 'Spacious', 'Comfortable']) {
      await page.getByLabel('Note list spacing', { exact: true }).selectOption(density);
      await expect.poll(() => list.evaluate(element => {
        const row = element.querySelector<HTMLElement>('[data-selected="true"]')!;
        return element.scrollHeight > element.clientHeight && row.offsetTop >= element.scrollTop - 1 && row.offsetTop + row.offsetHeight <= element.scrollTop + element.clientHeight + 1;
      })).toBe(true);
    }
    await body.fill('Keep this draft');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => frame.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(body).toHaveValue('Keep this draft');
    await expect(body).toHaveCSS('height', '130px');
    await expect(title).toHaveCSS('font-size', '18px');
    await expect(count).toBeHidden();
    await expect(frame.locator('.tn-note').last()).toHaveText('14// Untitled note');
    const directory = resolve(import.meta.dir, '../../../build/evidence/quick-notes');
    await mkdir(directory, { recursive: true });
    await frame.locator('#ts-notes-refined').screenshot({ path: resolve(directory, 'refined-reading-mobile.png') });
    await expect(page.locator('.preview-error')).toHaveCount(0);
  });

  for (const id of ids.filter(id => !id.endsWith('-refined'))) test(`${id}: reading controls, insertion, and scrolling preserve notes`, async () => {
    const page = browserPage();
    await page.goto(`/?widget=${id}`);
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('iframe');
    const body = frame.locator('textarea:visible').first();
    const title = frame.getByRole('textbox', { name: 'Note title', exact: true });
    const list = frame.locator('.ta-index,.tnb-note-list,.tnc-note-index,.ts-stack,.ts-note-list');
    const rows = list.locator(':scope > button,:scope > article');
    const selected = id.endsWith('d-ash') ? '.ts-memo:has([aria-expanded="true"])' : '[aria-pressed="true"],[aria-current="true"]';
    const showList = async () => {
      if (id.endsWith('c-console')) {
        const toggle = frame.locator('.tnc-notes-toggle');
        if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      }
    };
    const selectedVisible = () => list.evaluate((element, selector) => {
      const row = element.querySelector<HTMLElement>(selector)!;
      const bounds = element.getBoundingClientRect(), current = row.getBoundingClientRect();
      return current.top >= bounds.top - 1 && current.bottom <= bounds.bottom + 1;
    }, selected);
    await body.fill('one two\n継衛🙂');
    await body.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(3, 3));
    await page.getByLabel('Writing area height value', { exact: true }).fill('280');
    await page.getByLabel('Title size value', { exact: true }).fill('24');
    await page.getByLabel('Text count', { exact: true }).selectOption('Words');
    await page.getByLabel('Show note numbers', { exact: true }).uncheck();
    await expect(body).toHaveCSS('height', '280px');
    await expect(title).toHaveCSS('font-size', '24px');
    await expect(frame.locator('[data-text-count]')).toHaveText('3 words');
    expect(await body.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(3);
    await page.getByLabel('Text count', { exact: true }).selectOption('Characters');
    await expect(frame.locator('[data-text-count]')).toHaveText('11 characters');
    await page.getByLabel('Writing area height value', { exact: true }).fill('100');
    await expect(body).toHaveCSS('height', '100px');
    await page.getByLabel('Writing area height value', { exact: true }).fill('280');
    const numerals = frame.locator('.tnb-note-number,.tnc-note-number,.ts-number,.ts-note-number');
    if (await numerals.count()) await expect(numerals.first()).toBeHidden();
    else await expect(rows.first()).toHaveText('Before I leave');
    await page.getByLabel('New note position', { exact: true }).selectOption('Top');
    await frame.getByRole('button', { name: /NEW/ }).first().click();
    await expect(title).toBeFocused(); await title.fill('Front note');
    await showList(); await expect(rows.first()).toContainText(id.endsWith('d-ash') ? 'PERSONAL NOTE' : 'Front note');
    await expect(list.locator(selected)).toHaveCount(1);
    await expect.poll(selectedVisible).toBe(true);
    await page.getByLabel('New note position', { exact: true }).selectOption('Bottom');
    for (let i = 0; i < 9; i++) await frame.getByRole('button', { name: /NEW/ }).first().click();
    await title.fill('Last note'); await body.fill('Keep this draft');
    await showList();
    for (const density of ['Compact', 'Comfortable', 'Spacious']) {
      await page.getByLabel('Note list spacing', { exact: true }).selectOption(density);
      await page.getByLabel('Visible note rows value', { exact: true }).fill('2');
      await expect.poll(selectedVisible).toBe(true);
      const shortHeight = await list.evaluate(element => element.clientHeight);
      await page.getByLabel('Visible note rows value', { exact: true }).fill('8');
      await expect.poll(() => list.evaluate(element => element.clientHeight)).toBeGreaterThan(shortHeight);
      await expect.poll(selectedVisible).toBe(true);
      await expect(body).toHaveValue('Keep this draft');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Visible note rows value', { exact: true }).fill('2');
    await expect.poll(selectedVisible).toBe(true);
    await expect.poll(() => frame.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const directory = resolve(import.meta.dir, '../../../build/evidence/quick-notes');
    await mkdir(directory, { recursive: true });
    await page.locator('iframe').scrollIntoViewIfNeeded();
    await frame.locator('[data-appearance]').screenshot({ path: resolve(directory, `${id}-reading-mobile.png`) });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(body).toHaveValue('Keep this draft');
    await expect(frame.locator('[data-text-count]')).toBeHidden();
    await expect(page.getByLabel('New note position', { exact: true })).toHaveValue(id.endsWith('d-ash') ? 'Top' : 'Bottom');
    // Return to the original note after adding at both ends.
    await showList();
    if (id.endsWith('d-ash')) await rows.nth(1).locator('.ts-memo-top').click();
    else await rows.nth(1).click();
    await expect(body).toHaveValue('one two\n継衛🙂');
    await expect(page.locator('.preview-error')).toHaveCount(0);
  });

  for (const id of ids) test(`${id}: palettes update without shape controls or lost notes`, async () => {
    const page = browserPage();
    await page.goto(`/?widget=${id}`);
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('iframe');
    const root = frame.locator('[data-appearance]');
    const surface = root.locator('.ta-panel,.tnb-window,.tnc-panel,.ts-heading,.tn-panel,.ts-drawer').first();
    const body = frame.locator('textarea:visible').first();
    await body.fill('Keep this note while changing its appearance.');
    const initial = await surface.evaluate(element => {
      const css = getComputedStyle(element); return { paper: css.backgroundColor, radius: css.borderTopLeftRadius, border: css.borderTopWidth };
    });
    for (const [palette, paper, ink] of [
      ['Cobalt', 'rgb(16, 24, 39)', 'rgb(229, 237, 250)'],
      ['Forest', 'rgb(18, 30, 25)', 'rgb(228, 238, 231)'],
      ['Paper', 'rgb(244, 236, 221)', 'rgb(45, 41, 35)'],
    ]) {
      await page.getByLabel('Palette', { exact: true }).selectOption(palette!);
      await expect(surface).toHaveCSS('background-color', paper!);
      await expect(body).toHaveCSS('color', ink!);
      await expect(body).toHaveValue('Keep this note while changing its appearance.');
    }
    await page.getByLabel('Custom background hex', { exact: true }).fill('#172132');
    await page.getByLabel('Custom text hex', { exact: true }).fill('#e2e8f0');
    await page.getByLabel('Custom accent hex', { exact: true }).fill('#79b8ef');
    await page.getByLabel('Palette', { exact: true }).selectOption('Custom');
    await expect(page.getByLabel('Corner radius value', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Border thickness value', { exact: true })).toHaveCount(0);
    await expect(surface).toHaveCSS('background-color', 'rgb(23, 33, 50)');
    await expect(body).toHaveCSS('color', 'rgb(226, 232, 240)');
    await expect(surface).toHaveCSS('border-top-left-radius', '0px');
    await expect(surface).toHaveCSS('border-top-width', '1px');
    await expect(frame.getByRole('button', { name: /NEW/ }).first()).toHaveCSS('border-top-left-radius', '0px');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(surface).toBeVisible();
    const fits = await root.evaluate(element => element.scrollWidth <= element.clientWidth + 2);
    expect(fits).toBe(true);
    const directory = resolve(import.meta.dir, '../../../build/evidence/quick-notes');
    await mkdir(directory, { recursive: true });
    await root.screenshot({ path: resolve(directory, `${id}-custom.png`) });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(surface).toHaveCSS('background-color', initial.paper);
    await expect(surface).toHaveCSS('border-top-left-radius', initial.radius);
    await expect(surface).toHaveCSS('border-top-width', initial.border);
    await expect(body).toHaveValue('Keep this note while changing its appearance.');
    await expect(page.locator('.preview-error')).toHaveCount(0);
  });
  for (const id of ids) test(`${id}: settings, copied QML, and a complete native ZIP agree`, async () => {
    const page = browserPage();
    const { bundle, assets } = await loadLocal(resolve(import.meta.dir, '../../../build/content'), id);
    const values = { ...defaults(bundle.definition) };
    await page.goto(`/?widget=${id}`);
    await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('.detail-heading .tag')).toHaveText('QML READY');
    for (const setting of bundle.definition.settings) {
      const control = page.locator(`#setting-${setting.key}`);
      if (setting.type === 'boolean') { values[setting.key] = !setting.default; await control.setChecked(!setting.default); }
      else if (setting.type === 'enum') {
        const next = setting.label === 'Palette' ? 'Custom' : setting.choices.find(choice => choice !== setting.default)!;
        values[setting.key] = next; await control.selectOption(next);
      } else if (setting.type === 'color') {
        const next = setting.key === 'backgroundColor' ? '#172132' : setting.key === 'textColor' ? '#e2e8f0' : '#79b8ef';
        values[setting.key] = next;
        await page.getByLabel(`${setting.label} hex`, { exact: true }).fill(next);
      } else if (setting.type === 'number') {
        const next = Math.min(setting.max, setting.default + setting.step);
        values[setting.key] = next;
        await page.getByLabel(`${setting.label} value`, { exact: true }).fill(String(next));
      }
    }
    const generated = generate(bundle.definition, bundle.templates, values, assets);
    await page.getByLabel('Output file', { exact: true }).selectOption('Widget.qml');
    await page.getByRole('button', { name: 'Copy file', exact: true }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(generated.files.find(file => file.path === 'Widget.qml')!.text!);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download ZIP ↓' }).click();
    const download = await downloadEvent;
    const files = unzipSync(await readFile((await download.path())!));
    expect(Object.keys(files).sort()).toEqual(generated.files.map(file => file.path).sort());
    for (const file of generated.files) expect(files[file.path]).toEqual(new Uint8Array(file.bytes));
    expect(new TextDecoder().decode(files['Widget.qml'])).toBe(copied);
    expect(new TextDecoder().decode(files['LICENSE'])).toContain('Permission to use, copy, modify');
    const directory = resolve(import.meta.dir, '../../../build/evidence/quick-notes', id);
    await mkdir(directory, { recursive: true });
    for (const [name, bytes] of Object.entries(files)) {
      const path = resolve(directory, name); await mkdir(dirname(path), { recursive: true });
      await writeFile(path, name === 'Widget.qml' ? copied : bytes);
    }
    // Editing note contents must not put personal text into the exported component.
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: /NEW/ }).first().click();
    await frame.locator('textarea:visible').first().fill('Private session note');
    await expect(page.locator('.code-panel code')).not.toContainText('Private session note');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(frame.locator('textarea:visible').first()).toHaveValue('Private session note');
    await expect(page.locator('.preview-error')).toHaveCount(0);
    await page.screenshot({ path: resolve(directory, '../', `${id}-browser.png`), fullPage: true });
  });
}
