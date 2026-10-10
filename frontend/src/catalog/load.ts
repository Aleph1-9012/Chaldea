import { assertBundle, assertCatalog } from './contracts';
import type { Catalog, LoadedWidget, Summary } from './contracts';
import { defaults } from '../customizer/settings';
import { generate } from '../generator';
const siteBase = new URL(import.meta.env.BASE_URL, location.href);
export const contentUrl = (path: string): string => new URL(path, siteBase).href;
async function response(url: string | URL, signal?: AbortSignal): Promise<Response> {
  const result = await fetch(url, { credentials: 'omit', signal });
  if (!result.ok) throw new Error(`Could not load ${new URL(url, siteBase).pathname} (${result.status}).`);
  return result;
}
export async function loadCatalog(signal?: AbortSignal): Promise<Catalog> {
  const result: unknown = await (await response(contentUrl('catalog.json'), signal)).json();
  assertCatalog(result); return result;
}
export async function loadWidget(item: Summary, signal?: AbortSignal): Promise<LoadedWidget> {
  const url = contentUrl(item.bundleUrl);
  const bundle: unknown = await (await response(url, signal)).json();
  assertBundle(bundle);
  if (bundle.id !== item.id || bundle.revision !== item.revision || bundle.definition.status !== item.status || bundle.definition.settings.length !== item.settingsCount) throw new Error('Catalog and widget revision do not match. Reload the catalog.');
  const base = new URL('.', url);
  const assets = Object.fromEntries(await Promise.all(bundle.assets.map(async asset =>
    [asset.path, new Uint8Array(await (await response(new URL(asset.url, base), signal)).arrayBuffer())] as const)));
  const values = defaults(bundle.definition);
  if (bundle.definition.exports.some(f => f.kind === 'template')) generate(bundle.definition, bundle.templates, values, assets);
  return { bundle, base, assets };
}
