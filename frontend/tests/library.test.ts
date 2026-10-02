import { expect, test } from 'bun:test';
import { inspectExports, inspectPreview, samples } from '../scripts/check-library';
import { fixture } from './fixture';

const encode = (source: string) => new TextEncoder().encode(source);
test('preview checking parses scripts without executing them and resolves public assets', () => {
  const { preview, definition } = fixture();
  expect(inspectPreview(preview, definition.preview)).toBeGreaterThan(0);
  preview['preview/adapter.js'] = encode('throw new Error("must not execute");');
  expect(() => inspectPreview(preview, definition.preview)).not.toThrow();
  preview['preview/adapter.js'] = encode('const broken = ;');
  expect(() => inspectPreview(preview, definition.preview)).toThrow();
});

test('missing scripts, remote assets, and a missing runtime fail the preview check', () => {
  const { preview, definition } = fixture();
  for (const html of [
    '<script src="missing.js"></script>',
    '<script src="../preview-runtime.js"></script><img src="https://remote.invalid/pixel.png">',
    '<script src="adapter.js"></script>',
    '<script src="../preview-runtime.js"></script><style>body{background:url(missing.png)}</style>',
  ]) expect(() => inspectPreview({ ...preview, [definition.preview]: encode(html) }, definition.preview)).toThrow();
});

test('all declared setting types get valid default and boundary export samples', () => {
  const { definition, templates, assets } = fixture();
  const values = samples(definition);
  expect(values.map(value => value.level)).toEqual([68, 0, 100]);
  expect(values[1]!.label).toBe('');
  expect(String(values[2]!.label).length).toBe(24);
  expect(inspectExports(definition, templates, assets)).toBe(3);
  expect(() => inspectExports(definition, templates, {})).toThrow();
});
