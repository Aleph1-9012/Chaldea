import { assertDefinition } from '../catalog/contracts';
import type { Definition, Settings } from '../catalog/contracts';
import { validateSettings } from '../customizer/settings';

interface GeneratedFile { path: string; bytes: Uint8Array; text?: string }

export interface Snapshot { settings: Settings; files: readonly GeneratedFile[] }

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const property = /^\s*(?:readonly\s+)?property\s+(real|int|bool|string|color)\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*\{\{([a-z][a-zA-Z0-9]*)\}\}\s*$/;

export function templateBindings(template: string, definition: Definition): Set<string> {
  if (!template.trim()) throw new Error('QML templates must not be empty.');

  const keys = new Set<string>();

  for (const line of template.split(/\r?\n/)) {
    if (!line.includes('{{') && !line.includes('}}')) continue;

    const match = property.exec(line);

    if (!match) throw new Error('Placeholder must be a complete typed QML property value.');

    const [, type, key] = match;
    const setting = definition.settings.find(s => s.key === key);

    if (!setting || !key) throw new Error(`Undeclared placeholder ${key}.`);

    const compatible = setting.type === 'number'
      ? type === 'real' || (type === 'int' && setting.min >= -2147483648 && setting.max <= 2147483647 && [setting.min, setting.max, setting.step].every(Number.isInteger))
      : setting.type === 'boolean' ? type === 'bool'
      : setting.type === 'color' ? type === 'color' || type === 'string' : type === 'string';

    if (!compatible) throw new Error(`${key} has an incompatible QML property type.`);

    keys.add(key);
  }

  return keys;
}

export function serialize(value: string | number | boolean): string {
  if (Number.isNaN(value) || value === Infinity || value === -Infinity) throw new Error('QML numbers must be finite.');

  return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function generate(definition: Definition, templates: Readonly<Record<string, string>>, proposed: Settings, assets: Readonly<Record<string, Uint8Array>> = {}): Snapshot {
  assertDefinition(definition);

  const settings = validateSettings(definition, proposed);

  if (!definition.exports.some(f => f.kind === 'template')) throw new Error('Native QML is not available for this draft.');

  const bound = new Set<string>();
  const files = definition.exports.map(file => {
    if (file.kind === 'template') {
      const source = templates[file.path];

      if (source === undefined || !file.path.endsWith('.qml')) throw new Error(`Missing QML template: ${file.path}`);

      for (const key of templateBindings(source, definition)) bound.add(key);

      // Only one pass: placeholders inside user strings stay literal.
      const text = source.replace(/\{\{([a-z][a-zA-Z0-9]*)\}\}/g, (_match, key: string) => serialize(settings[key]!));

      return Object.freeze({ path: file.path, text, bytes: encoder.encode(text) });
    }

    const source = assets[file.path];

    if (!source) throw new Error(`Missing export file: ${file.path}`);

    const bytes = source.slice();
    let text: string | undefined;

    try { text = decoder.decode(bytes); } catch { /* Preserve binary assets byte for byte. */ }

    return Object.freeze({ path: file.path, bytes, text });
  });

  for (const setting of definition.settings) if (!bound.has(setting.key)) throw new Error(`Unbound setting: ${setting.key}`);

  return Object.freeze({ settings, files: Object.freeze(files) });
}
