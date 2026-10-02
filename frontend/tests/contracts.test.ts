import { expect, test } from 'bun:test';
import settings from '../../schemas/fixtures/settings.json';
import templates from '../../schemas/fixtures/templates.json';
import type { Setting } from '../src/catalog/contracts';
import { assertBundle, assertCatalog, assertDefinition } from '../src/catalog/contracts';
import { defaults, validateSettings } from '../src/customizer/settings';
import { templateBindings } from '../src/generator';
import { fixture } from './fixture';

test('settings and template rules agree with the shared Rust contract cases', () => {
  const { definition } = fixture();
  for (const item of settings) {
    const validate = () => defaults({ ...definition, settings: [item.setting as Setting] });
    try { if (item.valid) expect(validate).not.toThrow(); else expect(validate).toThrow(); }
    catch (cause) { throw new Error(item.name, { cause }); }
  }
  for (const item of templates) {
    const validate = () => templateBindings(item.source, definition);
    try { if (item.valid) expect(validate).not.toThrow(); else expect(validate).toThrow(); }
    catch (cause) { throw new Error(item.name, { cause }); }
  }
});

test('user settings reject missing, unknown, nonfinite, and out-of-range values', () => {
  const { definition } = fixture(), initial = defaults(definition);
  for (const level of [NaN, Infinity, -1, 101, 2.5, '50', undefined]) {
    expect(() => validateSettings(definition, { ...initial, level })).toThrow();
  }
  expect(() => validateSettings(definition, {})).toThrow();
  expect(() => validateSettings(definition, { ...initial, unexpected: true })).toThrow();
  expect(validateSettings(definition, initial)).toEqual(initial);
});

test('catalog and bundle boundaries reject duplicate IDs and mismatched exports', () => {
  const { definition, templates } = fixture();
  const revision = '0'.repeat(64);
  const item = { ...definition, revision, bundleUrl: `revisions/${definition.id}/${revision}/bundle.json`, thumbnailUrl: `revisions/${definition.id}/${revision}/${definition.thumbnail}` };
  // Catalog summaries contain only their declared fields.
  const { id, title, summary, category, tags, status, bundleUrl, thumbnailUrl } = item;
  const entry = { id, title, summary, category, tags, status, revision, bundleUrl, thumbnailUrl };
  expect(() => assertCatalog({ formatVersion: 1, widgets: [entry] })).not.toThrow();
  expect(() => assertCatalog({ formatVersion: 1, widgets: [entry, entry] })).toThrow();
  expect(() => assertCatalog({ formatVersion: 1, widgets: [{ ...entry, bundleUrl: '../wrong.json' }] })).toThrow();
  const bundle = { formatVersion: 1, id, revision, settingsSchemaVersion: 1, nativeBaseline: 'Contract fixture', definition, templates, usage: 'Instructions', assets: definition.exports.filter(file => file.kind === 'file').map(file => ({ path: file.path, url: `files/${file.path}` })) };
  expect(() => assertBundle(bundle)).not.toThrow();
  expect(() => assertBundle({ ...bundle, id: 'wrong-id' })).toThrow();
  expect(() => assertBundle({ ...bundle, assets: [] })).toThrow();
  expect(() => assertDefinition({ ...definition, exports: [...definition.exports, definition.exports[0]] })).toThrow();
});
