import { expect, test } from 'bun:test';
import { generate, serialize } from '../src/generator';
import { defaults } from '../src/customizer/settings';
import { fixture } from './fixture';

test('QML values remain literal and snapshots do not change after another edit', () => {
  const { definition, templates, assets } = fixture();
  const initial = defaults(definition);
  const first = generate(definition, templates, initial, assets);
  const label = '"\\\n継🙂{{level}}';
  const next = generate(definition, templates, { ...initial, label }, assets);
  const text = next.files.find(file => file.path === 'Widget.qml')!.text!;
  const encoded = /^    property string label: (.+)$/m.exec(text)![1]!;
  expect(JSON.parse(encoded)).toBe(label);

  for (const { settings, properties } of [
    {
      settings: { level: 0, label: '', accent: '#000000', meter: 'Segmented', corners: false },
      properties: [
        'property int level: 0',
        'property string label: ""',
        'property color accent: "#000000"',
        'property string meter: "Segmented"',
        'property bool corners: false',
      ],
    },
    {
      settings: { level: 100, label: 'abcdefghijklmnopqrstuvwx', accent: '#FFFFFF', meter: 'Continuous', corners: true },
      properties: [
        'property int level: 100',
        'property string label: "abcdefghijklmnopqrstuvwx"',
        'property color accent: "#ffffff"',
        'property string meter: "Continuous"',
        'property bool corners: true',
      ],
    },
  ]) {
    const snapshot = generate(definition, templates, settings, assets);
    const lines = snapshot.files.find(file => file.path === 'Widget.qml')!.text!.split('\n');

    for (const property of properties) expect(lines).toContain(`    ${property}`);
  }

  expect(first.settings.label).toBe('VOLUME');
  expect(Object.isFrozen(next.settings)).toBe(true);
  expect(Object.isFrozen(next.files)).toBe(true);
});

test('QML serialization rejects nonfinite numbers without coercing other scalars', () => {
  for (const value of [NaN, Infinity, -Infinity]) expect(() => serialize(value)).toThrow('QML numbers must be finite.');

  expect(serialize('Infinity')).toBe('"Infinity"');
});

test('exports preserve binary assets independently of the source bytes', () => {
  const { definition, templates, assets } = fixture();
  const bytes = new Uint8Array([0, 255, 128]);
  const snapshot = generate(definition, templates, defaults(definition), { ...assets, 'assets/sample.txt': bytes });
  bytes[0] = 99;
  expect([...snapshot.files.find(file => file.path === 'assets/sample.txt')!.bytes]).toEqual([0, 255, 128]);
});

test('drafts and incomplete export inputs fail closed', () => {
  const { definition, templates, assets } = fixture();
  const draft = { ...definition, status: 'draft' as const, exports: [] };
  expect(() => generate(draft, {}, defaults(draft))).toThrow('not available');
  expect(() => generate(definition, {}, defaults(definition), assets)).toThrow('Missing QML template');
  expect(() => generate(definition, templates, defaults(definition))).toThrow('Missing export file');
  definition.settings.push({ key: 'unused', label: 'Unused', type: 'boolean', default: false });
  expect(() => generate(definition, templates, defaults(definition), assets)).toThrow('Unbound');
});
