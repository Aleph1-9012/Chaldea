import source from '../../schemas/fixtures/export.json';
import { assertDefinition } from '../src/catalog/contracts';

export function fixture() {
  const definition = structuredClone(source.definition);
  assertDefinition(definition);

  const bytes = Object.fromEntries(Object.entries(source.files).map(([path, text]) => [path, new TextEncoder().encode(text)]));
  const preview: Record<string, Uint8Array> = {};
  const templates: Record<string, string> = {};
  const assets: Record<string, Uint8Array> = {};

  for (const file of definition.publicFiles) preview[file.path] = bytes[file.source]!;

  preview['preview-runtime.js'] = new Uint8Array();

  for (const file of definition.exports) {
    if (file.kind === 'template') templates[file.path] = new TextDecoder().decode(bytes[file.source]!);
    else assets[file.path] = bytes[file.source]!;
  }

  return { definition, templates, assets, preview };
}
