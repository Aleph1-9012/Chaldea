import { readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
import { zipSync, unzipSync } from 'fflate';
import { assertBundle, assertCatalog, assertDefinition, safePath } from '../src/catalog/contracts';
import type { Definition, Settings } from '../src/catalog/contracts';
import { defaults, validateSettings } from '../src/customizer/settings';
import { generate } from '../src/generator';
import { repository, widgetSources } from './widget-sources';

const decoder = new TextDecoder('utf-8', { fatal: true });
const origin = 'https://preview.invalid';
function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

// Parse classic scripts without executing widget code or starting a browser.
export function inspectPreview(files: Readonly<Record<string, Uint8Array>>, entry: string): number {
  let scripts = 0;
  const reference = (from: string, value: string): string | undefined => {
    if (!value || value.startsWith('#') || value.startsWith('data:')) return;
    const url = new URL(value, `${origin}/${from}`);
    const path = decodeURIComponent(url.pathname.slice(1));
    if (url.origin !== origin || !files[path]) throw new Error(`${from}: undeclared or remote asset ${value}`);
    return path;
  };
  const javascript = (path: string, source: string) => {
    new Script(source, { filename: path });
    scripts++;
  };
  let runtimeLoaded = false;
  for (const [path, bytes] of Object.entries(files)) {
    if (path === 'preview-runtime.js') continue;
    if (!/\.(js|html|css)$/.test(path)) continue;
    const source = decoder.decode(bytes);
    if (path.endsWith('.js')) { javascript(path, source); continue; }
    if (path.endsWith('.html')) {
      const html = source.replace(/<!--[\s\S]*?-->/g, '');
      for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        const tag = match[1]!, body = match[2]!;
        const type = attribute(tag, 'type')?.toLowerCase();
        if (type === 'module') throw new Error(`${path}: opaque previews require classic scripts`);
        if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
        const src = attribute(tag, 'src');
        if (src !== undefined) {
          const target = reference(path, src);
          if (path === entry && target === 'preview-runtime.js') runtimeLoaded = true;
        } else if (body.trim()) javascript(`${path}:inline`, body);
      }
      for (const match of html.matchAll(/<(?:img|link|source|video|audio|iframe)\b[^>]*>/gi)) {
        const tag = match[0];
        for (const name of ['src', 'href', 'poster']) {
          const value = attribute(tag, name);
          if (value !== undefined) reference(path, value);
        }
      }
    }
    for (const match of source.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gi)) reference(path, match[1]!.trim());
  }
  if (!runtimeLoaded) throw new Error(`${entry}: missing shared preview runtime`);
  return scripts;
}

export function samples(definition: Definition): Settings[] {
  const initial = defaults(definition);
  const low = { ...initial }, high = { ...initial };
  for (const setting of definition.settings) {
    switch (setting.type) {
      case 'number':
        low[setting.key] = setting.min;
        high[setting.key] = Number((setting.min + Math.floor((setting.max - setting.min) / setting.step + 1e-9) * setting.step).toPrecision(14));
        break;
      case 'boolean': low[setting.key] = false; high[setting.key] = true; break;
      case 'enum': low[setting.key] = setting.choices[0]!; high[setting.key] = setting.choices.at(-1)!; break;
      case 'color': low[setting.key] = '#000000'; high[setting.key] = '#ffffff'; break;
      case 'string': low[setting.key] = ''; high[setting.key] = 'x'.repeat(setting.maxLength); break;
    }
  }
  return [initial, low, high].map(values => validateSettings(definition, values));
}

export function inspectExports(definition: Definition, templates: Record<string, string>, assets: Record<string, Uint8Array>): number {
  const settings = samples(definition);
  if (!definition.exports.some(file => file.kind === 'template')) return 0;
  for (const values of settings) {
    const snapshot = generate(definition, templates, values, assets);
    const files = Object.fromEntries(snapshot.files.map(file => [file.path, file.bytes]));
    const unzipped = unzipSync(zipSync(files, { level: 0 }));
    assert.deepEqual(Object.keys(unzipped).sort(), definition.exports.map(file => file.path).sort());
    for (const [path, bytes] of Object.entries(files)) assert.deepEqual(unzipped[path], bytes, path);
  }
  return settings.length;
}

async function confinedFile(root: string, path: string): Promise<Uint8Array> {
  if (!safePath(path)) throw new Error(`Unsafe source path: ${path}`);
  const file = await realpath(join(root, path));
  if (relative(root, file).startsWith('..')) throw new Error(`Source escapes widget: ${path}`);
  return new Uint8Array(await readFile(file));
}

async function checkLibrary() {
  const config = Bun.TOML.parse(await readFile(join(repository, 'chaldea.toml'), 'utf8')) as Record<string, unknown>;
  const runtime = new Uint8Array(await readFile(join(repository, String(config.preview_runtime))));
  new Script(decoder.decode(runtime), { filename: 'preview-runtime.js' });
  const definitions = new Map<string, Definition>();
  let scripts = 0, exports = 0;
  for (const widget of await widgetSources()) {
    try {
      const raw: unknown = JSON.parse(await readFile(join(widget.dir, 'widget.json'), 'utf8'));
      const definition = { formatVersion: config.format_version, settingsSchemaVersion: config.settings_schema_version, license: config.license, ...raw as object };
      assertDefinition(definition);
      const inputs = new Map<string, Uint8Array>();
      for (const path of new Set([...definition.publicFiles, ...definition.exports].map(file => file.source))) inputs.set(path, await confinedFile(widget.dir, path));
      const publicFiles = Object.fromEntries(definition.publicFiles.map(file => [file.path, inputs.get(file.source)!]));
      publicFiles['preview-runtime.js'] = runtime;
      scripts += inspectPreview(publicFiles, definition.preview);
      const templates = Object.fromEntries(definition.exports.filter(file => file.kind === 'template').map(file => [file.path, decoder.decode(inputs.get(file.source)!)]));
      const assets = Object.fromEntries(definition.exports.filter(file => file.kind === 'file').map(file => [file.path, inputs.get(file.source)!]));
      exports += inspectExports(definition, templates, assets);
      definitions.set(definition.id, definition);
    } catch (cause) { throw new Error(`widgets/${widget.path}: ${cause instanceof Error ? cause.message : cause}`, { cause }); }
  }

  // Verify the built artifact without serving it or launching a browser.
  const dist = join(repository, 'dist');
  for (const name of ['index.html', 'LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_LICENSES.txt']) await readFile(join(dist, name));
  const catalog: unknown = JSON.parse(await readFile(join(dist, 'catalog.json'), 'utf8'));
  assertCatalog(catalog);
  const published = [...definitions.values()].filter(widget => widget.status === 'published').map(widget => widget.id).sort();
  assert.deepEqual(catalog.widgets.map(widget => widget.id).sort(), published, 'Production catalog must contain exactly the published widgets');
  const revisionDirs = await readdir(join(dist, 'revisions')).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT' && !published.length) return [];
    throw error;
  });
  assert.deepEqual(revisionDirs.sort(), published, 'Draft files must not enter the production artifact');
  for (const item of catalog.widgets) {
    const location = join(dist, item.bundleUrl);
    const bundle: unknown = JSON.parse(await readFile(location, 'utf8'));
    assertBundle(bundle);
    assert.equal(bundle.revision, item.revision);
    assert.deepEqual(bundle.definition, definitions.get(item.id));
    for (const asset of bundle.assets) await readFile(join(dirname(location), asset.url));
    await readFile(join(dist, item.thumbnailUrl));
    await readFile(join(dirname(location), bundle.definition.preview));
  }
  console.log(`Library passed: ${definitions.size} widgets, ${scripts} preview scripts, ${exports} QML/ZIP samples, ${published.length} production entries.`);
}

if (import.meta.main) await checkLibrary();
