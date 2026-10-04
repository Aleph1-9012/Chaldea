import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import Ajv from 'ajv';
import sourceIndexSchema from '../../schemas/source-index.schema.json';

interface SourceEntry { id: string; path: string; thumbnailSource: string }

interface SourceIndex { formatVersion: 1; sourceRoot: string; widgets: SourceEntry[] }

interface WidgetSource extends SourceEntry { dir: string }

export const repository = resolve(import.meta.dir, '../..');

const ajv = new Ajv({ allErrors: true, strict: false });
const checkSourceIndex = ajv.compile<SourceIndex>(sourceIndexSchema);

// Rust discovers sources and records their authoring paths alongside local content.
export async function widgetSources(content = join(repository, 'build/content'), projectRoot = repository): Promise<WidgetSource[]> {
  const index = JSON.parse(await readFile(join(content, 'source-index.json'), 'utf8'));

  if (!checkSourceIndex(index)) throw new Error(`Invalid source index: ${ajv.errorsText(checkSourceIndex.errors)}. Run make content.`);

  const ids = new Set<string>();
  const paths = new Set<string>();
  const sources: WidgetSource[] = [];

  for (const entry of index.widgets) {
    if (ids.has(entry.id) || paths.has(entry.path)) throw new Error('Source index contains duplicate widget IDs or paths. Run make content.');

    ids.add(entry.id);
    paths.add(entry.path);
    sources.push({ ...entry, dir: resolve(projectRoot, index.sourceRoot, entry.path) });
  }

  return sources;
}

export function findWidget(sources: WidgetSource[], selector: string): WidgetSource {
  const path = selector.replace(/^widgets\//, '').replace(/\/$/, '');
  const widget = sources.find(source => source.id === selector || source.path === path);

  if (!widget) throw new Error(`Unknown widget: ${selector}. Use its ID or source path under widgets/.`);

  return widget;
}

export async function writeThumbnail(source: WidgetSource, bytes: Uint8Array): Promise<string> {
  const root = resolve(source.dir);
  const destination = resolve(root, source.thumbnailSource);
  const path = relative(root, destination);

  if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) throw new Error(`${source.id}: thumbnail destination must stay inside its widget folder.`);
  if (await realpath(root) !== root) throw new Error(`${source.id}: thumbnail destination includes a symlink: ${root}`);

  let component = root;

  // Inspect metadata only. Rust still owns source discovery and content reads.
  for (const part of path.split(sep)) {
    component = join(component, part);

    const metadata = await lstat(component).catch((cause: NodeJS.ErrnoException) => {
      if (cause.code === 'ENOENT') return;

      throw cause;
    });

    if (metadata?.isSymbolicLink()) throw new Error(`${source.id}: thumbnail destination includes a symlink: ${component}`);
    if (metadata && (component === destination ? !metadata.isFile() : !metadata.isDirectory())) throw new Error(`${source.id}: invalid thumbnail destination component: ${component}`);
  }

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);

  return destination;
}
