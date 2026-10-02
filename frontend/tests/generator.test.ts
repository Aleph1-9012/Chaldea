import { expect, test } from 'bun:test';
import { generate } from '../src/generator';
import { defaults } from '../src/customizer/settings';
import { fixture } from './fixture';

test('QML values remain literal and snapshots do not change after another edit', () => {
  const { definition, templates, assets } = fixture();
  const initial = defaults(definition);
  const first = generate(definition, templates, initial, assets);
  const label = '"\\\n継🙂{{level}}';
  const next = generate(definition, templates, { ...initial, level: 97, label, corners: false }, assets);
  const text = next.files.find(file => file.path === 'Widget.qml')!.text!;
  expect(text).toContain('property int level: 97');
  expect(text).toContain('property bool corners: false');
  const encoded = /^    property string label: (.+)$/m.exec(text)![1]!;
  expect(JSON.parse(encoded)).toBe(label);
  expect(first.settings.level).toBe(68);
  expect(Object.isFrozen(next.settings)).toBe(true);
  expect(Object.isFrozen(next.files)).toBe(true);
});

test('exports preserve binary assets and fail when a required file is absent', () => {
  const { definition, templates, assets } = fixture();
  definition.exports.push({ source: 'pixel.bin', path: 'assets/pixel.bin', kind: 'file' });
  const bytes = new Uint8Array([0, 255, 128]);
  const snapshot = generate(definition, templates, defaults(definition), { ...assets, 'assets/pixel.bin': bytes });
  bytes[0] = 99;
  expect([...snapshot.files.at(-1)!.bytes]).toEqual([0, 255, 128]);
  expect(() => generate(definition, templates, defaults(definition), assets)).toThrow('Missing export file');
});

test('drafts cannot export and incomplete template bindings fail closed', () => {
  const { definition, templates, assets } = fixture();
  const draft = { ...definition, status: 'draft' as const, exports: [] };
  expect(() => generate(draft, {}, defaults(draft))).toThrow('not available');
  expect(() => generate(definition, {}, defaults(definition), assets)).toThrow('Missing QML template');
  definition.settings.push({ key: 'unused', label: 'Unused', type: 'boolean', default: false });
  expect(() => generate(definition, templates, defaults(definition), assets)).toThrow('Unbound');
});
