import source from '../../schemas/fixtures/export.json';
import { assertDefinition } from '../src/catalog/contracts';

export function fixture() {
  const definition: unknown = structuredClone(source.definition);
  assertDefinition(definition);
  const bytes = Object.fromEntries(Object.entries(source.files).map(([path, text]) => [path, new TextEncoder().encode(text)]));
  const preview: Record<string, Uint8Array> = { ...Object.fromEntries(definition.publicFiles.map(file => [file.path, bytes[file.source]!])), 'preview-runtime.js': new Uint8Array() };
  return {
    definition,
    templates: Object.fromEntries(definition.exports.filter(file => file.kind === 'template').map(file => [file.path, new TextDecoder().decode(bytes[file.source]!)])),
    assets: Object.fromEntries(definition.exports.filter(file => file.kind === 'file').map(file => [file.path, bytes[file.source]!])),
    preview,
  };
}
