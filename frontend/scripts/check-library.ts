import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
import { zipSync, unzipSync } from 'fflate';
import type { Bundle, Definition, Settings } from '../src/catalog/contracts';
import { defaults, validateSettings } from '../src/customizer/settings';
import { generate } from '../src/generator';
import { loadRevision, readCatalog } from './export';
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

async function checkLibrary() {
  // Rust is the only reader of widget sources. Inspect the revisions it packaged.
  const local = await readCatalog(join(repository, 'build/content'));
  const sources = await widgetSources();
  const packaged = local.catalog.widgets.map(widget => widget.id).sort();
  assert.deepEqual(packaged, sources.map(source => source.id).sort(), 'Local content must contain exactly the widget sources. Run make content.');

  const bundles = new Map<string, Bundle>();
  let scripts = 0, exports = 0;

  for (const source of sources) {
    try {
      const item = local.catalog.widgets.find(widget => widget.id === source.id)!;
      const { bundle, assets, dir } = await loadRevision(local.root, item);
      const runtime = await readFile(join(dir, 'preview-runtime.js'));
      new Script(decoder.decode(runtime), { filename: 'preview-runtime.js' });

      const publicFiles: Record<string, Uint8Array> = { 'preview-runtime.js': runtime };

      for (const file of bundle.definition.publicFiles) publicFiles[file.path] = await readFile(join(dir, file.path));

      scripts += inspectPreview(publicFiles, bundle.definition.preview);
      exports += inspectExports(bundle.definition, bundle.templates, assets);
      bundles.set(bundle.id, bundle);
    } catch (cause) { throw new Error(`widgets/${source.path}: ${cause instanceof Error ? cause.message : cause}`, { cause }); }
  }

  // Verify the built artifact without serving it or launching a browser.
  const dist = join(repository, 'dist');
  for (const name of ['index.html', 'LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_LICENSES.txt']) await readFile(join(dist, name));

  const production = await readCatalog(dist);
  const published = [...bundles.values()].filter(bundle => bundle.definition.status === 'published').map(bundle => bundle.id).sort();
  assert.deepEqual(production.catalog.widgets.map(widget => widget.id).sort(), published, 'Production catalog must contain exactly the published widgets');

  const revisionDirs = await readdir(join(dist, 'revisions')).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT' && !published.length) return [];
    throw error;
  });
  assert.deepEqual(revisionDirs.sort(), published, 'Draft files must not enter the production artifact');

  for (const item of production.catalog.widgets) {
    const { bundle, dir } = await loadRevision(production.root, item);
    assert.deepEqual(bundle, bundles.get(item.id), `${item.id}: production must ship the revision that was checked`);
    await readFile(join(dist, item.thumbnailUrl));
    await readFile(join(dir, bundle.definition.preview));
  }

  console.log(`Library passed: ${bundles.size} widgets, ${scripts} preview scripts, ${exports} QML/ZIP samples, ${published.length} production entries.`);
}

if (import.meta.main) await checkLibrary();
