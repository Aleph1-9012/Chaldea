import { describe, expect, test } from 'bun:test';
import cases from '../../../schemas/fixtures/settings.json';
import templates from '../../../schemas/fixtures/templates.json';
import type { Definition, Setting } from '../../src/catalog/contracts';
import { assertBundle } from '../../src/catalog/contracts';
import { defaults, validateSettings } from '../../src/customizer/settings';
import { generate, serialize, templateBindings } from '../../src/generator';
import { bundle, assets } from '../fixture';
const definition = bundle.definition;
const initial = defaults(definition);

describe('shared Rust/browser semantic fixtures', () => {
  for (const fixture of cases) test(fixture.name, () => {
    const d = { ...definition, settings: [fixture.setting as Setting] };
    if (fixture.valid) expect(() => defaults(d)).not.toThrow(); else expect(() => defaults(d)).toThrow();
  });
  for (const fixture of templates) test(fixture.name, () => {
    if (fixture.valid) expect(() => templateBindings(fixture.source, definition)).not.toThrow();
    else expect(() => templateBindings(fixture.source, definition)).toThrow();
  });
});
test('escapes QML strings without evaluating or recursively substituting them', () => {
  for (const label of ['"; Qt.quit(); //', 'line\nbreak', '\\path\\', '継🌟\u2028\u2029', '{{level}}', '\0tab\t']) {
    const result = generate(definition, bundle.templates, { ...initial, label }, assets);
    expect(result.files[0]!.text).toContain(`property string label: ${serialize(label)}`);
    expect(JSON.parse(serialize(label))).toBe(label);
  }
});
test('rejects nonfinite, unknown, missing and out-of-range settings', () => {
  for (const level of [NaN, Infinity, -1, 101, 2.5, '50', undefined]) expect(() => validateSettings(definition, { ...initial, level })).toThrow();
  expect(() => validateSettings(definition, { ...initial, sneaky: 'x' })).toThrow();
  expect(() => validateSettings(definition, {})).toThrow();
});
test('copies exact binary assets and fails on missing required files', () => {
  const d: Definition = { ...definition, exports: [...definition.exports, { source: 'pixel.bin', path: 'assets/pixel.bin', kind: 'file' }] };
  const bytes = new Uint8Array([0, 255, 127, 128]);
  const generated = generate(d, bundle.templates, initial, { ...assets, 'assets/pixel.bin': bytes });
  bytes[0] = 90;
  expect([...generated.files.at(-1)!.bytes]).toEqual([0, 255, 127, 128]);
  expect(() => generate(d, bundle.templates, initial, assets)).toThrow('Missing export file');
});
test('all views can consume the same immutable accepted snapshot', () => {
  const first = generate(definition, bundle.templates, initial, assets);
  const last = generate(definition, bundle.templates, { ...initial, level: 97, corners: false }, assets);
  expect(first.settings.level).toBe(68);
  expect(last.files[0]!.text).toContain('property int level: 97');
  expect(last.files[0]!.text).toContain('property bool corners: false');
  expect(Object.isFrozen(last.settings)).toBe(true);
});
test('rejects swapped revision IDs and incomplete manifests at browser boundary', () => {
  expect(() => assertBundle({ ...bundle, id: 'other' })).toThrow();
  expect(() => assertBundle({ ...bundle, assets: [] })).toThrow();
});
test('no stale files after generation fails', () => {
  expect(() => generate(definition, {}, initial, assets)).toThrow();
  expect(() => generate({ ...definition, settings: [...definition.settings, { key: 'extra', label: 'Extra', type: 'boolean', default: true }] }, bundle.templates, { ...initial, extra: true }, assets)).toThrow('Unbound');
});
