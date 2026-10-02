import { readdir, readFile, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export interface WidgetSource { id: string; category: string; dir: string; path: string }
export const repository = resolve(import.meta.dir, '../..');

// Source paths are an authoring detail. Public IDs always come from widget.json.
export async function widgetSources(root = join(repository, 'widgets')): Promise<WidgetSource[]> {
  root = await realpath(root);
  const sources: WidgetSource[] = [];
  const ids = new Set<string>();
  async function visit(dir: string, allowEmpty = false): Promise<void> {
    const definition = join(dir, 'widget.json');
    if (existsSync(definition)) {
      const file = await realpath(definition);
      if (relative(dir, file).startsWith('..')) throw new Error(`Definition escapes widget folder: ${definition}`);
      const { id, category } = JSON.parse(await readFile(file, 'utf8'));
      if (typeof id !== 'string' || !/^[a-z][a-z0-9-]+$/.test(id) || typeof category !== 'string') throw new Error(`Invalid identity in ${definition}`);
      if (ids.has(id)) throw new Error(`Duplicate widget ID: ${id}`);
      ids.add(id); sources.push({ id, category, dir, path: relative(root, dir) });
      return;
    }
    const before = sources.length;
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isSymbolicLink()) throw new Error(`Source groups cannot contain symlinks: ${join(dir, entry.name)}`);
      if (entry.isDirectory()) await visit(join(dir, entry.name));
    }
    if (sources.length === before && !allowEmpty) throw new Error(`No widget.json in source group: ${dir}`);
  }
  await visit(root, true);
  return sources.sort((a, b) => a.id.localeCompare(b.id));
}

export function findWidget(sources: WidgetSource[], selector: string): WidgetSource {
  const path = selector.replace(/^widgets\//, '').replace(/\/$/, '');
  const widget = sources.find(source => source.id === selector || source.path === path);
  if (!widget) throw new Error(`Unknown widget: ${selector}. Use its ID or source path under widgets/.`);
  return widget;
}
