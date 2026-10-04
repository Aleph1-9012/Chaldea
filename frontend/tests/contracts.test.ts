import { expect, test } from 'bun:test';
import settings from '../../schemas/fixtures/settings.json';
import templates from '../../schemas/fixtures/templates.json';
import { assertBundle, assertCatalog, assertDefinition } from '../src/catalog/contracts';
import { assertSettings, defaults, FieldError, validateSettings } from '../src/customizer/settings';
import { templateBindings } from '../src/generator';
import { fixture } from './fixture';

test('settings and template rules agree with the shared Rust contract cases', () => {
  const { definition } = fixture();

  for (const item of settings) {
    const validate = () => {
      const candidate = { ...definition, settings: [item.setting] };
      assertDefinition(candidate);

      return defaults(candidate);
    };

    try { if (item.valid) expect(validate).not.toThrow(); else expect(validate).toThrow(); }
    catch (cause) { throw new Error(item.name, { cause }); }
  }

  for (const item of templates) {
    const validate = () => templateBindings(item.source, definition);

    try { if (item.valid) expect(validate).not.toThrow(); else expect(validate).toThrow(); }
    catch (cause) { throw new Error(item.name, { cause }); }
  }
});

test('user settings reject invalid values with field errors and normalize valid values', () => {
  const { definition } = fixture(), initial = defaults(definition);

  for (const level of [NaN, Infinity, -Infinity, -1, 101, '50']) {
    expect(() => validateSettings(definition, { ...initial, level })).toThrow();
  }

  expect(() => validateSettings(definition, {})).toThrow(new FieldError('level', 'Level: enter a number between 0 and 100.'));
  expect(() => validateSettings(definition, { ...initial, level: 0.5 })).toThrow(new FieldError('level', 'Level: use increments of 1.'));
  expect(() => validateSettings(definition, { ...initial, unexpected: true })).toThrow();

  const normalized = validateSettings(definition, { ...initial, level: -0, accent: '#ABCDEF' });

  expect(Object.is(normalized.level, 0)).toBe(true);
  expect(normalized.accent).toBe('#abcdef');
});

test('settings JSON rejects malformed objects and nested values at the parsing boundary', () => {
  const { definition } = fixture();

  for (const source of ['null', '[]', 'true', '50', '"settings"', '{"level":null}', '{"level":[]}', '{"level":{}}', '{"level":1e999}']) {
    const value: unknown = JSON.parse(source);
    expect(() => assertSettings(value)).toThrow();
  }

  const value: unknown = JSON.parse(JSON.stringify(defaults(definition)));
  assertSettings(value);
  expect(validateSettings(definition, value)).toEqual(defaults(definition));
});

test('catalog and bundle boundaries reject duplicate IDs and mismatched exports', () => {
  const { definition, templates } = fixture();
  const revision = '0'.repeat(64);
  const { id, title, summary, category, tags, status } = definition;
  const prefix = `revisions/${id}/${revision}/`;
  const entry = { id, title, summary, category, tags, status, revision, bundleUrl: `${prefix}bundle.json`, thumbnailUrl: `${prefix}${definition.thumbnail}` };

  expect(() => assertCatalog({ formatVersion: 1, widgets: [entry] })).not.toThrow();
  expect(() => assertCatalog({ formatVersion: 1, widgets: [entry, entry] })).toThrow();
  expect(() => assertCatalog({ formatVersion: 1, widgets: [{ ...entry, bundleUrl: '../wrong.json' }] })).toThrow();
  const bundle = { formatVersion: 1, id, revision, settingsSchemaVersion: 1, nativeBaseline: 'Contract fixture', definition, templates, usage: 'Instructions', assets: definition.exports.flatMap(file => file.kind === 'file' ? [{ path: file.path, url: `files/${file.path}` }] : []) };

  expect(() => assertBundle(bundle)).not.toThrow();
  expect(() => assertBundle({ ...bundle, id: 'wrong-id' })).toThrow();
  expect(() => assertBundle({ ...bundle, assets: [] })).toThrow();
  expect(() => assertDefinition({ ...definition, exports: [...definition.exports, definition.exports[0]] })).toThrow();
});
