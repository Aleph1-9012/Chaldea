import source from '../../schemas/fixtures/export.json';
import { assertBundle, assertDefinition } from '../src/catalog/contracts';
import type { Bundle, Summary } from '../src/catalog/contracts';

// Test data is separate from widgets/ and is never packaged into the library.
const definition: unknown = source.definition;
assertDefinition(definition);
export const files: Readonly<Record<string, string>> = source.files;
const revision = '0'.repeat(64);
export const bundle: Bundle = {
  formatVersion: 1, id: definition.id, revision, settingsSchemaVersion: 1,
  nativeBaseline: 'Internal contract fixture', definition,
  templates: Object.fromEntries(definition.exports.filter(f => f.kind === 'template').map(f => [f.path, files[f.source]!])),
  assets: definition.exports.filter(f => f.kind === 'file').map(f => ({ path: f.path, url: `files/${f.path}` })),
  usage: files['README.md']!,
};
assertBundle(bundle);
export const assets = Object.fromEntries(definition.exports.filter(f => f.kind === 'file').map(f => [f.path, new TextEncoder().encode(files[f.source]!)]));
export const summary: Summary = {
  id: definition.id, title: definition.title, summary: definition.summary,
  category: definition.category, tags: definition.tags, status: definition.status, revision,
  bundleUrl: `revisions/${definition.id}/${revision}/bundle.json`,
  thumbnailUrl: `revisions/${definition.id}/${revision}/${definition.thumbnail}`,
};
