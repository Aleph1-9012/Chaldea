import { readFile, mkdir, writeFile, realpath } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { assertBundle, assertCatalog, safePath } from '../src/catalog/contracts';
import type { Settings, Summary } from '../src/catalog/contracts';
import { assertSettings, defaults } from '../src/customizer/settings';
import { generate } from '../src/generator';

export async function readCatalog(content: string) {
  const root = await realpath(content);
  const catalog: unknown = JSON.parse(await readFile(join(root, 'catalog.json'), 'utf8'));
  assertCatalog(catalog);

  return { root, catalog };
}

// Load one packaged revision and its export assets from a content directory.
export async function loadRevision(root: string, item: Summary) {
  const location = join(root, item.bundleUrl);
  const bundle: unknown = JSON.parse(await readFile(location, 'utf8'));
  assertBundle(bundle);

  if (bundle.id !== item.id || bundle.revision !== item.revision) throw new Error('Revision mismatch.');

  const dir = dirname(location);
  const assets: Record<string, Uint8Array> = {};

  for (const asset of bundle.assets) {
    const file = await realpath(join(dir, asset.url));

    if (relative(root, file).startsWith('..')) throw new Error('Asset escapes content directory.');

    assets[asset.path] = new Uint8Array(await readFile(file));
  }

  return { bundle, assets, dir };
}

async function loadLocal(content: string, id: string) {
  const { root, catalog } = await readCatalog(content);
  const item = catalog.widgets.find(w => w.id === id);

  if (!item) throw new Error(`Unknown widget ${id}. Run make content first.`);

  return loadRevision(root, item);
}

async function exportWidget(content: string, id: string, output: string, overrides: Settings) {
  const { bundle, assets } = await loadLocal(content, id);
  const snapshot = generate(bundle.definition, bundle.templates, { ...defaults(bundle.definition), ...overrides }, assets);
  // Never overwrite an existing directory, including through a symlink.
  await mkdir(output, { recursive: false });

  for (const file of snapshot.files) {
    if (!safePath(file.path)) throw new Error('Unsafe export path.');

    const dest = join(output, file.path);

    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.bytes, { flag: 'wx' });
  }

  return snapshot;
}

if (import.meta.main) {
  const [id, output, settingsFile] = process.argv.slice(2);

  if (!id || !output) throw new Error('Usage: bun run export <widget-id> <new-output-directory> [settings.json]');

  let overrides: Settings = {};

  if (settingsFile) {
    const value: unknown = JSON.parse(await readFile(settingsFile, 'utf8'));
    assertSettings(value);
    overrides = value;
  }

  const content = resolve(import.meta.dir, '../../build/content');
  const snapshot = await exportWidget(content, id, resolve(output), overrides);

  console.log(`Exported ${snapshot.files.length} files to ${resolve(output)}`);
}
