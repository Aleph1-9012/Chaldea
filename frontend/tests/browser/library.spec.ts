import { test } from 'bun:test';
import archive from '../../../docs/archive-imports.json';
import { registerArchiveTests } from './archive';
import { registerQuickNotesTests } from './quick-notes';
import { expect } from '@playwright/test';
import { browserPage } from './setup';
import { withContractFixture } from './fixture';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { unzipSync } from 'fflate';
const evidence = resolve(import.meta.dirname, '../../../build/evidence');
test('customize, rapid changes, copy, complete ZIP, and query reload', async () => {
  const page = browserPage(); await withContractFixture(page);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: /Contract fixture/ }).click();
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Label', { exact: true }).fill('OUTPUT "A"');
  await page.locator('#setting-level').evaluate((element: HTMLInputElement) => {
    for (const value of ['10', '45', '97']) { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.getByRole('button', { name: 'Copy file', exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('property int level: 97');
  expect(copied).toContain(`property string label: ${JSON.stringify('OUTPUT "A"')}`);
  await expect(page.frameLocator('iframe').locator('[data-level]')).toHaveText('97');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download ZIP ↓' }).click();
  const download = await pending; const zip = unzipSync(await readFile((await download.path())!));
  expect(new TextDecoder().decode(zip['Widget.qml'])).toBe(copied);
  expect(Object.keys(zip).sort()).toEqual(['LICENSE', 'README.md', 'Widget.qml', 'assets/sample.txt']);
  const output = resolve(evidence, 'contract-export'); await mkdir(output, { recursive: true });
  for (const [name, bytes] of Object.entries(zip)) { const file = resolve(output, name); await mkdir(dirname(file), { recursive: true }); await writeFile(file, name === 'Widget.qml' ? copied : bytes); }
  await page.screenshot({ path: resolve(evidence, 'contract-customizer.png'), fullPage: true });
  await page.reload(); await expect(page.getByLabel('Level value')).toHaveValue('68');
  expect(new URL(page.url()).searchParams.get('widget')).toBe('contract-fixture');
  expect(new URL(page.url()).searchParams.has('level')).toBe(false);
  expect(errors).toEqual([]);
});
test('invalid changes disable code, then reset restores valid output', async () => {
  const page = browserPage(); await withContractFixture(page);
  await page.goto('/?widget=contract-fixture'); await page.getByLabel('Level value').fill('101');
  await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download ZIP ↓' })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('between 0 and 100');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toBeEnabled();
});
test('preview failure preserves independently valid QML', async () => {
  const page = browserPage(); await withContractFixture(page);
  await page.route('**/preview/index.html', route => route.abort()); await page.goto('/?widget=contract-fixture');
  await expect(page.locator('.preview-error')).toContainText('Preview unavailable', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toBeEnabled();
});
test('catalog contains the requested designs and the Phase lock narrow preview is accessible', async () => {
  const page = browserPage();
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.locator('.widget-card')).toHaveCount(30 + archive.entries.length);
  await page.getByRole('searchbox').fill('no-such-widget'); await expect(page.getByText('No matching widgets.', { exact: false })).toBeVisible();
  await page.getByRole('searchbox').fill('phase'); await page.locator('.widget-card[href="?widget=tsugumori"]').click();
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('button', { name: 'Preview unlock animation' })).toBeEnabled();
  await expect.poll(() => frame.locator('body').evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, 'phase-lock-mobile.png'), fullPage: true });
});
test('existing widget responds to typing, Escape, Enter, and its own buttons', async () => {
  const page = browserPage(); await page.goto('/?widget=tsugumori');
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  const input = frame.getByLabel(/Demo password/);
  const glyph = frame.locator('.wb-glyph');
  const before = await glyph.screenshot();
  await input.fill('dummy');
  await expect(input).toHaveValue('xxxxx');
  await expect.poll(async () => Buffer.compare(before, await glyph.screenshot())).not.toBe(0);
  await input.press('Escape'); await expect(input).toHaveValue('');
  await input.fill('test'); await input.press('Enter');
  await expect(frame.locator('[data-sequence-status]')).toContainText('cleared');
  await expect(input).toBeDisabled();
  await frame.getByRole('button', { name: 'Play lock', exact: true }).click();
  await expect(frame.locator('[data-sequence-status]')).toContainText('locked frame');
  await expect(input).toBeEnabled();
  await frame.getByRole('button', { name: 'Preview unlock animation' }).click();
  await expect(frame.locator('[data-sequence-status]')).toContainText('cleared');
  await frame.getByRole('button', { name: 'Play lock', exact: true }).click();
  await expect(input).toBeEnabled();
  await page.screenshot({ path: resolve(evidence, 'phase-lock-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '← All widgets', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
});
test('HTML-only draft stays preview-only and rejects forged messages', async () => {
  const page = browserPage();
  await page.goto('/?widget=tsugumori');
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByText('This existing HTML design is interactive.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toHaveCount(0);
  await expect(page.locator('.customizer')).toHaveCount(0);
  await page.evaluate(() => window.postMessage({ channel: 'xlr8:preview', type: 'error', token: crypto.randomUUID() }, '*'));
  await expect(page.locator('iframe')).toHaveCount(1);
  expect(await page.locator('iframe').getAttribute('sandbox')).toBe('allow-scripts allow-downloads');
});
test('stale requests cannot replace the existing design', async () => {
  const page = browserPage(); await withContractFixture(page);
  await page.route('**/revisions/contract-fixture/**/bundle.json', async route => { await new Promise(resolve => setTimeout(resolve, 700)); await route.fallback().catch(() => {}); });
  await page.goto('/?widget=contract-fixture');
  await page.getByRole('link', { name: 'XLR8 home' }).click();
  await page.locator('.widget-card[href="?widget=tsugumori"]').click();
  await expect(page.getByRole('heading', { name: 'Tsugumori / Phase lock', exact: true })).toBeVisible();
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(800);
  await expect(page.getByRole('heading', { name: 'Tsugumori / Phase lock', exact: true })).toBeVisible();
});
test('control-to-code responsiveness on this test machine', async () => {
  const page = browserPage(); await withContractFixture(page); await page.goto('/?widget=contract-fixture');
  await expect(page.getByLabel('Level value')).toBeVisible();
  const elapsed = await page.locator('#setting-level').evaluate((element: HTMLInputElement) => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) { element.value = String(i); element.dispatchEvent(new Event('input', { bubbles: true })); }
    return performance.now() - start;
  });
  expect(elapsed).toBeLessThan(1500);
  await mkdir(evidence, { recursive: true });
  await writeFile(resolve(evidence, 'responsiveness.json'), JSON.stringify({ updates: 100, totalMilliseconds: elapsed, millisecondsPerUpdate: elapsed / 100, viewport: '1440x1000', scope: 'synchronous settings validation, generation, code rendering; local Chromium, not a device benchmark' }, null, 2));
});

const curtains = ["curtain-red-field", "curtain-hull-stencil", "curtain-panel-bands", "curtain-signal-sweep"];
const refinements = ["curtain-original-red-field", "curtain-registration", "curtain-service-rail", "curtain-ghost-mark"];
const glyphs = ["tsugumori-recursive-relays", "tsugumori-branch-grammar", "tsugumori-shifted-script", "tsugumori-oblique-ligatures", "tsugumori-radical-exchange"];
const organic = ["tsugumori-fish-in-space"];
const art = ["tsugumori-anamorphic-704", "tsugumori-magnetic-powder", "tsugumori-kinetic-typography", "tsugumori-mechanical-rhythm", "tsugumori-pachinko-gutter", "tsugumori-kirigami-panel"];
const lab = ["tsugumori-specimen-chamber", "tsugumori-orbital-playground", "tsugumori-resonance-sculpture", "tsugumori-signal-hunting", "tsugumori-gravity-sandbox", "tsugumori-session-fossils"];
const selectedDesigns = [...curtains, ...refinements, ...glyphs, ...organic, ...art, ...lab, "tsugumori-glyph-bay-typing", "tsugumori-clipboard-flow", "tsugumori-clipboard-rice-fit"];
for (const id of selectedDesigns) test(`${id}: desktop and mobile load without clipping or remote assets`, async () => {
  const page = browserPage(); const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') failures.push(`Remote request: ${request.url()}`); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  if (id === 'curtain-original-red-field') await expect(page.locator('.customizer')).toHaveCount(0);
  else await expect(page.locator('.customizer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy file', exact: true })).toHaveCount(0);
  const frame = page.frameLocator('iframe');
  // Each imported design has its own document and direct controls, with no design chooser.
  await expect(frame.locator('button[data-design], button[data-study], button[data-mode]')).toHaveCount(0);
  if (curtains.includes(id) || refinements.includes(id)) await expect(frame.locator('.ts-study')).toHaveCount(1);
  if (organic.includes(id) || lab.includes(id)) await expect(frame.locator('[data-controls]')).toHaveCount(1);
  await mkdir(resolve(evidence, 'selected-designs'), { recursive: true });
  for (const [width, label] of [[1440, 'desktop'], [390, 'mobile']] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await expect.poll(() => frame.locator('body').evaluate(() => ({
      width: document.documentElement.scrollWidth <= innerWidth + 1,
      height: document.documentElement.scrollHeight <= innerHeight + 1,
    }))).toEqual({ width: true, height: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    // Bring the whole iframe into the viewport for capture; Chromium otherwise
    // culls some offscreen iframe tiles in a full-page screenshot.
    const height = await page.locator('body').evaluate(body => Math.ceil(body.scrollHeight));
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: resolve(evidence, `selected-designs/${id}-${label}.png`), fullPage: true });
  }
  expect(failures).toEqual([]);
});
for (const id of [...curtains, ...refinements]) test(`${id}: replay, scrub, switch samples, and customize`, async () => {
  const page = browserPage(); await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('.ts-study')).toHaveCount(1);
  const reveal = frame.getByRole('slider', { name: 'Inspect reveal' });
  await reveal.press('End'); await expect(frame.locator('.ts-state')).toHaveText('100% REVEALED');
  for (const cover of await frame.locator('.ts-curtain, .ts-band, .ts-sweep').all()) await expect(cover).toBeHidden();
  await reveal.press('ArrowLeft'); await expect(reveal).toHaveValue('99');
  await frame.getByRole('button', { name: 'Player', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Player', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(frame.locator('.ts-song')).toHaveText('SIDONIA');
  await frame.getByRole('button', { name: 'Replay', exact: true }).click();
  await frame.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await frame.getByLabel('Playback speed').selectOption('2');
  if (curtains.includes(id)) {
    await page.getByLabel('Curtain red hex').fill('#3377aa');
    await expect(frame.locator('#ts-curtain-studies')).toHaveCSS('--ts-red', '#3377aa');
    if (id !== 'curtain-signal-sweep') {
      await page.getByLabel('Stencil labels').uncheck();
      await expect(frame.locator('#ts-curtain-studies')).toHaveAttribute('data-labels', 'false');
    }
  } else if (id !== 'curtain-original-red-field') {
    await expect(page.getByRole('slider', { name: 'Added element opacity', exact: true })).toHaveValue('0.8');
    await expect(page.getByLabel('Added element opacity value')).toHaveValue('0.8');
    await page.getByLabel('Added elements', { exact: true }).uncheck();
    await expect(frame.locator('#ts-curtain-a-refinements')).toHaveAttribute('data-details', 'false');
    await page.getByLabel('Added element opacity value').fill('0.5');
    await expect(frame.locator('#ts-curtain-a-refinements')).toHaveCSS('--ts-detail-opacity', '0.5');
  }
  if (id !== 'curtain-original-red-field') await page.getByRole('button', { name: 'Reset', exact: true }).click();
  if (refinements.includes(id) && id !== 'curtain-original-red-field') await expect(page.getByLabel('Added element opacity value')).toHaveValue('0.8');
  await expect(page.locator('.generation-error')).toBeHidden();
});
for (const id of [...glyphs, 'tsugumori-glyph-bay-typing']) test(`${id}: typing, reversal, and preview dialogs`, async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe'); const input = frame.getByLabel(/Demo password/);
  const glyph = frame.locator(glyphs.includes(id) ? '.tr-art' : '.ts-glyphs');
  const empty = await glyph.screenshot(); await input.fill('dummy'); await expect(input).toHaveValue('xxxxx');
  await expect.poll(async () => Buffer.compare(empty, await glyph.screenshot())).not.toBe(0);
  await input.press('End'); await input.press('Backspace'); await expect(input).toHaveValue('xxxx');
  if (glyphs.includes(id)) {
    await input.press('Enter'); await expect(frame.locator('.tr-screen')).toHaveAttribute('data-unlock', 'true');
  } else {
    await input.press('Enter'); await expect(frame.locator('.ts-feedback')).toHaveText('UNLOCK PREVIEW');
  }
  const restart = frame.getByRole('button', { name: 'RESTART', exact: true });
  // Scroll the parent page before computing the iframe click point.
  await restart.scrollIntoViewIfNeeded(); await restart.click();
  await expect(frame.getByRole('dialog')).toBeVisible();
  await expect(frame.getByRole('heading', { name: 'Restart?', exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'BACK TO LOCKSCREEN' }).press('Escape');
  await expect(frame.getByRole('dialog')).toBeHidden();
  await frame.getByRole('button', { name: 'SHUTDOWN', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Shut down?', exact: true })).toBeVisible();
  await frame.getByRole('button', { name: 'BACK TO LOCKSCREEN' }).click();
  await expect(frame.getByRole('dialog')).toBeHidden();
  await expect(input).toBeEnabled();
});

for (const id of organic) test(`${id}: direct actions, pause, and only its own settings`, async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('button', { name: 'GREET', exact: true })).toHaveCount(0);
  await frame.getByRole('button', { name: 'GATHER', exact: true }).click();
  await expect(frame.locator('[data-status]')).toHaveText('The pair draw together.');
  await frame.getByRole('button', { name: 'RELEASE', exact: true }).click();
  await page.getByLabel('Fish detail value').fill('1.4');
  await frame.getByRole('button', { name: 'Play animation' }).click();
  await frame.getByRole('button', { name: 'Pause animation' }).click();
  await expect(frame.locator('[data-status]')).toHaveText('Animation paused.');
  await expect(page.locator('.generation-error')).toBeHidden();
});

for (const id of art) test(`${id}: individual artwork responds to its own controls`, async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe'), canvas = frame.locator('canvas');
  if (id === 'tsugumori-anamorphic-704') {
    const align = frame.getByRole('button', { name: 'Align 704', exact: true });
    await align.scrollIntoViewIfNeeded(); await align.click();
    await expect(frame.getByLabel('Angle', { exact: true })).toHaveValue('24');
    await canvas.scrollIntoViewIfNeeded(); const bounds = (await canvas.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * .65, bounds.y + bounds.height / 2, { steps: 5 }); await page.mouse.up();
    await expect(frame.getByLabel('Angle', { exact: true })).not.toHaveValue('24');
  } else if (id === 'tsugumori-magnetic-powder') {
    await frame.getByRole('button', { name: 'ADD MAGNET', exact: true }).click();
    await expect(frame.getByRole('button', { name: 'REMOVE 03', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await frame.getByRole('button', { name: 'POLE: N', exact: true }).click(); await expect(frame.getByRole('button', { name: 'POLE: S', exact: true })).toBeVisible();
  } else if (id === 'tsugumori-kinetic-typography') {
    await frame.getByRole('button', { name: 'Pluck strands', exact: true }).click();
    await frame.getByLabel('Tension', { exact: true }).press('End'); await expect(frame.getByLabel('Tension', { exact: true })).toHaveValue('8');
  } else if (id === 'tsugumori-mechanical-rhythm') {
    await frame.getByLabel('Pin', { exact: true }).selectOption('1');
    const pin = frame.getByRole('button', { name: /^(Set|Remove) pin$/ }); const prior = await pin.getAttribute('aria-pressed'); await pin.click();
    await expect(pin).toHaveAttribute('aria-pressed', prior === 'true' ? 'false' : 'true');
    await frame.getByRole('button', { name: 'Sound on', exact: true }).click(); await frame.getByRole('button', { name: 'Sound off', exact: true }).click();
  } else if (id === 'tsugumori-pachinko-gutter') {
    await frame.getByRole('button', { name: 'Launch ball', exact: true }).click();
    await expect(frame.locator('[data-status]')).toContainText(/ball|launched/i);
  } else {
    await frame.getByLabel('Cut pattern', { exact: true }).selectOption('bridges'); await frame.getByLabel('Fold angle', { exact: true }).press('End');
    await expect(frame.getByLabel('Fold angle', { exact: true })).toHaveValue('85');
  }
  await page.getByLabel('Compact canvas').check(); await expect(canvas).toHaveCSS('height', '320px');
});

for (const [index, id] of lab.entries()) test(`${id}: direct controls and independent in-memory state`, async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(`/?widget=${id}`);
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  if (index === 0) {
    await frame.getByRole('button', { name: 'Freeze + keep form', exact: true }).click();
    await expect(frame.locator('[data-archive="forms"] button')).toHaveCount(1);
    await frame.getByRole('button', { name: 'Release specimen', exact: true }).click();
  } else if (index === 1) {
    await frame.getByLabel('Preview workspace').selectOption('2');
    await frame.getByRole('button', { name: 'Reverse orbit', exact: true }).click();
    await expect(frame.getByLabel('Preview workspace')).toHaveValue('2');
  } else if (index === 2) {
    await frame.getByRole('button', { name: 'Play demo beat', exact: true }).click();
    await expect(frame.locator('[data-status]')).toContainText('Silent simulated beat');
    await frame.getByRole('button', { name: 'Pause demo beat', exact: true }).click();
  } else if (index === 3) {
    for (let i = 0; i < 3; i++) await frame.getByRole('button', { name: 'Assist one dial', exact: true }).click();
    await frame.getByRole('button', { name: 'Collect discovery', exact: true }).click();
    await expect(frame.locator('[data-archive="signals"] button')).toHaveCount(1);
  } else if (index === 4) {
    await frame.getByRole('button', { name: 'Hold center well', exact: true }).click();
    await frame.getByRole('button', { name: 'Add second well', exact: true }).click();
    await frame.getByRole('button', { name: 'Remove second well', exact: true }).press('Escape');
    await expect(frame.getByRole('button', { name: 'Hold center well', exact: true })).toHaveAttribute('aria-pressed', 'false');
  } else {
    await frame.getByLabel('Specimen name').fill('Test fossil');
    await frame.getByRole('button', { name: 'Archive fossil', exact: true }).click();
    await expect(frame.locator('[data-archive="fossils"] button')).toContainText('Test fossil');
  }
  if ([0, 2, 3, 5].includes(index)) await page.getByLabel('Point detail').selectOption('Sparse');
  else await expect(page.getByLabel('Point detail')).toHaveCount(0);
  await page.getByLabel('Signal accent hex').fill('#3377aa');
  await expect(frame.locator('#ts-play-lab')).toHaveCSS('--ts-red', '#3377aa');
  await page.getByRole('button', { name: '← All widgets', exact: true }).click(); await expect(page.locator('iframe')).toHaveCount(0);
  await page.locator(`.widget-card[href="?widget=${id}"]`).click();
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.frameLocator('iframe').locator('[data-archive] button')).toHaveCount(0);
});

test('each design is discoverable by title and a direct URL; grouped entries are absent', async () => {
  const page = browserPage(); await page.goto('/');
  const ids = await page.locator('.widget-card').evaluateAll(cards => cards.map(card => new URL((card as HTMLAnchorElement).href).searchParams.get('widget')));
  expect(ids.sort()).toEqual([...selectedDesigns, 'tsugumori', ...archive.entries.map(entry => entry.id)].sort());
  await page.getByRole('searchbox').fill('Magnetic powder');
  await expect(page.locator('.widget-card')).toHaveCount(1);
  await page.getByRole('link', { name: /Magnetic powder/ }).click();
  await expect(page).toHaveURL(/widget=tsugumori-magnetic-powder/);
  await expect(page.frameLocator('iframe').getByRole('button', { name: 'ADD MAGNET', exact: true })).toBeVisible();
});

test('Clipboard flow: keyboard restore, text and image paste, pinning, search, deletion, and settings', async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?widget=tsugumori-clipboard-flow');
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  const paste = frame.getByRole('button', { name: 'PASTE', exact: true });
  await paste.scrollIntoViewIfNeeded(); await paste.click();
  await expect(frame.locator('.tc-pasted')).toHaveText('Choose USE ENTRY in the history first.');
  // Enter must use the focused row, even when another row was selected.
  await frame.getByRole('button', { name: /Player design notes/ }).press('Enter');
  await expect(frame.locator('.tc-drawer')).toBeHidden();
  await expect(frame.locator('.tc-pasted')).toHaveText('Ready to paste: Player design notes');
  await paste.scrollIntoViewIfNeeded(); await paste.click();
  await expect(frame.locator('.tc-pasted')).toContainText('Keep the selected row red.');
  await frame.getByRole('button', { name: 'OPEN HISTORY', exact: true }).click();
  await expect(frame.getByRole('searchbox')).toBeFocused();
  await frame.getByRole('searchbox').fill('theme');
  await expect(frame.locator('.tc-row')).toHaveCount(1);
  await frame.getByRole('button', { name: 'PINNED', exact: true }).click();
  await frame.getByRole('button', { name: 'Unpin selected entry', exact: true }).click();
  await expect(frame.getByText('No matching entries', { exact: true })).toBeVisible();
  await expect(frame.locator('.tc-preview-actions')).toBeHidden();
  await frame.getByRole('button', { name: 'PINNED', exact: true }).click();
  await frame.getByRole('searchbox').fill('menu');
  await frame.getByRole('button', { name: 'Pin selected entry', exact: true }).click();
  await expect(frame.getByRole('button', { name: /Menu screenshot/ })).toContainText('PINNED');
  await frame.getByRole('button', { name: 'USE ENTRY ↵', exact: true }).click();
  await paste.scrollIntoViewIfNeeded(); await paste.click();
  await expect(frame.locator('.tc-pasted').getByRole('img')).toHaveAttribute('aria-label', 'Sample red and black Tsugumori menu screenshot');
  await frame.getByRole('button', { name: 'OPEN HISTORY', exact: true }).click();
  await frame.getByRole('button', { name: 'Delete selected entry', exact: true }).click();
  await expect(frame.locator('.tc-count')).toHaveText('03 ENTRIES');
  await frame.getByRole('searchbox').fill('');
  await page.getByLabel('Row spacing').selectOption('Compact');
  await page.getByLabel('Background grid', { exact: true }).uncheck();
  await expect(frame.locator('.tc-row').first()).toHaveCSS('padding-top', '9px');
  await expect(frame.locator('.tc-drawer')).toHaveCSS('background-image', 'none');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Row spacing')).toHaveValue('Comfortable');
  await expect(frame.locator('.tc-row').first()).toHaveCSS('padding-top', '14px');
  await expect(frame.locator('.tc-drawer')).not.toHaveCSS('background-image', 'none');
  await page.reload(); await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await expect(frame.locator('.tc-count')).toHaveText('04 ENTRIES');
  await expect(frame.locator('.tc-pasted')).toHaveText('Choose a history entry, then paste here.');
});

test('Clipboard rice fit: keyboard selection, restore, delete and undo, empty search, close and palette', async () => {
  const page = browserPage(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?widget=tsugumori-clipboard-rice-fit');
  await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: /Grid texture/ }).press('ArrowDown');
  await expect(frame.getByRole('button', { name: /Player design notes/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(frame.locator('.cr-text')).toContainText('Keep the selected row red.');
  await frame.getByRole('button', { name: 'USE ENTRY', exact: true }).click();
  await expect(frame.locator('.cr-state')).toHaveText('RESTORE SIMULATED // 02');
  await frame.getByRole('button', { name: 'Pin selected entry', exact: true }).click();
  await frame.getByRole('button', { name: 'PINNED', exact: true }).click();
  await expect(frame.locator('.cr-total')).toHaveText('02');
  await frame.getByRole('button', { name: 'Delete selected entry', exact: true }).click();
  await expect(frame.locator('.cr-state')).toHaveText('ENTRY REMOVED');
  await expect(frame.locator('.cr-total')).toHaveText('01');
  await frame.getByRole('button', { name: 'UNDO', exact: true }).click();
  await expect(frame.getByRole('button', { name: /Player design notes/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(frame.locator('.cr-total')).toHaveText('02');
  await expect(frame.getByRole('button', { name: 'UNDO', exact: true })).toBeHidden();
  await frame.getByRole('button', { name: 'Unpin selected entry', exact: true }).click();
  await expect(frame.getByRole('button', { name: /Tsugumori repository/ })).toHaveAttribute('aria-pressed', 'true');
  await frame.getByRole('button', { name: 'PINNED', exact: true }).click();
  await frame.getByRole('searchbox').fill('missing-entry');
  await expect(frame.getByText('No matching entries.', { exact: true })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'USE ENTRY', exact: true })).toBeDisabled();
  await expect(frame.getByRole('button', { name: 'Delete selected entry', exact: true })).toBeDisabled();
  await expect(frame.getByRole('button', { name: 'Pin selected entry', exact: true })).toBeDisabled();
  await frame.getByRole('searchbox').fill('palette');
  await expect(frame.getByRole('img', { name: 'Sample black, red and bone palette' })).toBeVisible();
  await frame.getByRole('searchbox').press('Escape');
  await expect(frame.locator('.cr-open')).toBeHidden();
  await frame.getByRole('button', { name: 'REOPEN PREVIEW', exact: true }).click();
  await expect(frame.getByRole('searchbox')).toBeFocused();
  await expect(frame.getByRole('searchbox')).toHaveValue('palette');
  await page.getByLabel('Palette', { exact: true }).selectOption('Charcoal');
  await page.getByLabel('Fine grid').uncheck();
  await expect(frame.locator('#tsugu-clipboard-fit')).toHaveAttribute('data-paper', 'charcoal');
  await expect(frame.locator('#tsugu-clipboard-fit')).toHaveAttribute('data-grid', 'off');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(frame.locator('#tsugu-clipboard-fit')).toHaveAttribute('data-paper', 'bone');
  await expect(frame.locator('#tsugu-clipboard-fit')).toHaveAttribute('data-grid', 'on');
  await page.reload(); await expect(page.locator('.preview-host')).toHaveAttribute('data-ready', 'true');
  await expect(frame.getByRole('searchbox')).toHaveValue('');
  await expect(frame.locator('.cr-total')).toHaveText('04');
  await expect(frame.getByRole('button', { name: /Grid texture/ })).toHaveAttribute('aria-pressed', 'true');
});

registerArchiveTests();

registerQuickNotesTests();
