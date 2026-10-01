import Ajv from 'ajv';
import widgetSchema from '../../../schemas/widget.schema.json';
import catalogSchema from '../../../schemas/catalog.schema.json';
import bundleSchema from '../../../schemas/bundle.schema.json';

type BaseSetting = { key: string; label: string };
export type Setting = BaseSetting & (
  | { type: 'number'; default: number; min: number; max: number; step: number }
  | { type: 'string'; default: string; maxLength: number }
  | { type: 'color'; default: string }
  | { type: 'boolean'; default: boolean }
  | { type: 'enum'; default: string; choices: string[] }
);
export type Settings = Readonly<Record<string, string | number | boolean>>;
export interface Definition {
  formatVersion: 1; settingsSchemaVersion: number; license: 'MIT' | '0BSD';
  id: string; title: string; summary: string; category: string; tags: string[];
  status: 'draft' | 'published'; preview: string; thumbnail: string; usage?: string;
  settings: Setting[];
  publicFiles: { source: string; path: string }[];
  exports: { source: string; path: string; kind: 'template' | 'file' }[];
}
export interface Summary extends Pick<Definition, 'id' | 'title' | 'summary' | 'category' | 'tags' | 'status'> {
  revision: string; bundleUrl: string; thumbnailUrl: string;
}
export interface Catalog { formatVersion: 1; widgets: Summary[] }
export interface Bundle {
  formatVersion: 1; id: string; revision: string; settingsSchemaVersion: number;
  nativeBaseline: string; definition: Definition; templates: Record<string, string>;
  assets: { path: string; url: string }[]; usage: string;
}
export interface LoadedWidget { bundle: Bundle; base: URL; assets: Readonly<Record<string, Uint8Array>> }
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(widgetSchema);
const checkDefinition = ajv.compile<Definition>(widgetSchema);
const checkCatalog = ajv.compile<Catalog>(catalogSchema);
const checkBundle = ajv.compile<Bundle>(bundleSchema);
export const safePath = (path: string): boolean => path.length <= 180 && /^[A-Za-z0-9_-][A-Za-z0-9_.-]*(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$/.test(path);

function distinctPaths(paths: string[]): boolean {
  return paths.every((p, index) => safePath(p) && paths.every((q, j) => j === index || (p !== q && !p.startsWith(`${q}/`))));
}
export function assertDefinition(value: unknown): asserts value is Definition {
  if (!checkDefinition(value)) throw new Error(`Invalid definition: ${ajv.errorsText(checkDefinition.errors)}`);
  const d = value;
  if (d.formatVersion !== 1 || !Number.isInteger(d.settingsSchemaVersion) || d.settingsSchemaVersion < 1 || !d.license) throw new Error('Missing resolved project defaults.');
  if (!distinctPaths(d.exports.map(f => f.path)) || !distinctPaths([...d.publicFiles.map(f => f.path), 'bundle.json', 'preview-runtime.js', 'files'])) throw new Error('Duplicate, unsafe, or reserved file mapping.');
  if (![d.preview, d.thumbnail].every(p => d.publicFiles.some(f => f.path === p)) || !d.preview.endsWith('.html')) throw new Error('Preview and thumbnail must be declared public files.');
  if (d.status === 'published' && (!d.exports.some(f => f.kind === 'template') || !d.usage || !d.exports.some(f => f.source === d.usage && f.kind === 'file') || !d.exports.some(f => f.path === 'LICENSE' && f.kind === 'file'))) throw new Error('Published widgets require QML, usage instructions, and a license.');
}
export function assertCatalog(value: unknown): asserts value is Catalog {
  if (!checkCatalog(value)) throw new Error(`Invalid catalog: ${ajv.errorsText(checkCatalog.errors)}`);
  const ids = new Set<string>();
  for (const item of value.widgets) {
    const prefix = `revisions/${item.id}/${item.revision}/`;
    if (ids.has(item.id) || item.bundleUrl !== `${prefix}bundle.json` || !item.thumbnailUrl.startsWith(prefix)) throw new Error('Catalog has duplicate IDs or inconsistent revision paths.');
    ids.add(item.id);
  }
}
export function assertBundle(value: unknown): asserts value is Bundle {
  if (!checkBundle(value)) throw new Error(`Invalid revision: ${ajv.errorsText(checkBundle.errors)}`);
  assertDefinition(value.definition);
  const d = value.definition;
  if (d.status === 'published' && !value.usage.trim()) throw new Error('Published widgets require nonempty usage instructions.');
  if (value.id !== d.id || d.formatVersion !== value.formatVersion || value.settingsSchemaVersion !== d.settingsSchemaVersion) throw new Error('Revision identity does not match its definition.');
  const templates = d.exports.filter(f => f.kind === 'template').map(f => f.path).sort();
  const assets = d.exports.filter(f => f.kind === 'file').map(f => f.path).sort();
  if (JSON.stringify(templates) !== JSON.stringify(Object.keys(value.templates).sort()) || JSON.stringify(assets) !== JSON.stringify(value.assets.map(f => f.path).sort()) || value.assets.some(f => f.url !== `files/${f.path}`)) throw new Error('Revision export manifest is inconsistent.');
}
