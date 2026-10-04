import { expect, test } from 'bun:test';
import { inspectExports, inspectPreview } from '../scripts/check-library';
import { fixture } from './fixture';

const encode = (source: string) => new TextEncoder().encode(source);

test('preview checks parse scripts without executing them and reject broken asset references', () => {
  const { preview, definition } = fixture();
  const runtime = '<script src="../preview-runtime.js"></script>';

  expect(inspectPreview(preview, definition.preview)).toBeGreaterThan(0);
  preview['preview/adapter.js'] = encode('throw new Error("must not execute");');
  expect(() => inspectPreview(preview, definition.preview)).not.toThrow();

  for (const { html, error } of [
    { html: `${runtime}<script src="missing.js"></script>`, error: 'undeclared or remote asset missing.js' },
    { html: `${runtime}<img src="https://remote.invalid/pixel.png">`, error: 'undeclared or remote asset https://remote.invalid/pixel.png' },
    { html: '<script src="adapter.js"></script>', error: 'missing shared preview runtime' },
    { html: `${runtime}<style>body{background:url(missing.png)}</style>`, error: 'undeclared or remote asset missing.png' },
  ]) expect(() => inspectPreview({ ...preview, [definition.preview]: encode(html) }, definition.preview)).toThrow(error);

  preview['preview/adapter.js'] = encode('const broken = ;');
  expect(() => inspectPreview(preview, definition.preview)).toThrow(SyntaxError);
});

test('each native widget gets one complete default export check and drafts are skipped', () => {
  const { definition, templates, assets } = fixture();

  expect(inspectExports(definition, templates, assets)).toBe(1);
  expect(inspectExports({ ...definition, settings: [] }, { 'Widget.qml': 'import QtQuick\nItem {}' }, assets)).toBe(1);
  expect(inspectExports({ ...definition, status: 'draft', exports: [] }, {}, {})).toBe(0);
});
