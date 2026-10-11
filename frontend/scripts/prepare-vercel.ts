import { copyFile, lstat, mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const requiredFiles = [
  'index.html', 'catalog.json', 'LICENSE.txt', 'NOTICE.txt', 'THIRD_PARTY_LICENSES.txt',
  'licenses/faculty-glyphic.txt', 'licenses/jetbrains-mono.txt',
];

const retainedDirectories = ['revisions', 'assets'];

async function checkDirectory(path: string): Promise<void> {
  if (await realpath(path) !== path) throw new Error(`Release path includes a symlink: ${path}`);
  if (!(await lstat(path)).isDirectory()) throw new Error(`Expected a directory: ${path}`);
}

export async function prepareVercel(selected: string, output: string, retained: string[] = []) {
  const destination = resolve(output);
  const releases = [selected, ...retained].map(path => resolve(path));
  const files = new Map<string, string>();
  const directories = new Set<string>();

  async function collect(root: string, path: string): Promise<void> {
    const source = join(root, path);
    const metadata = await lstat(source);

    if (metadata.isSymbolicLink()) throw new Error(`Release contains a symlink: ${source}`);

    if (metadata.isDirectory()) {
      if (files.has(path)) throw new Error(`Conflicting release path: ${path}`);

      directories.add(path);

      for (const name of await readdir(source)) {
        await collect(root, path ? `${path}/${name}` : name);
      }

      return;
    }

    if (!metadata.isFile()) throw new Error(`Release contains a non-file entry: ${source}`);
    if (directories.has(path)) throw new Error(`Conflicting release path: ${path}`);

    const previous = files.get(path);

    if (previous) {
      const [existing, incoming] = await Promise.all([readFile(previous), readFile(source)]);

      if (!existing.equals(incoming)) throw new Error(`Conflicting immutable release file: ${path}`);

      return;
    }

    files.set(path, source);
  }

  for (const [index, release] of releases.entries()) {
    const outputPath = relative(release, destination);

    if (!outputPath || (outputPath !== '..' && !outputPath.startsWith(`..${sep}`))) {
      throw new Error(`Output must be outside every release directory: ${destination}`);
    }

    await checkDirectory(release);

    if (index === 0) {
      await collect(release, '');

      for (const path of requiredFiles) {
        if (!files.has(path)) throw new Error(`Selected release is missing required file: ${path}`);
      }

      for (const path of retainedDirectories) {
        if (!directories.has(path)) throw new Error(`Selected release is missing required directory: ${path}`);
      }
    } else {
      for (const path of retainedDirectories) {
        await collect(release, path);
      }
    }
  }

  const overrides: Record<string, { contentType: string }> = {};

  for (const path of files.keys()) {
    if (['.qml', '.md'].includes(extname(path).toLowerCase())) {
      overrides[path] = { contentType: 'text/plain; charset=utf-8' };
    }
  }

  const config = {
    version: 3,
    routes: [
      { src: '^/.*$', headers: { 'X-Content-Type-Options': 'nosniff' }, continue: true },
      { src: '^/(?:index\\.html|catalog\\.json)?$', headers: { 'Cache-Control': 'no-cache' }, continue: true },
      { src: '^/(?:revisions|assets)/.*$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
      { handle: 'filesystem' },
    ],
    overrides,
  };

  await mkdir(dirname(destination), { recursive: true });
  await checkDirectory(dirname(destination));
  // Exclusive creation protects an existing output, including a dangling symlink.
  await mkdir(destination);

  const staticRoot = join(destination, 'static');

  for (const path of directories) {
    await mkdir(join(staticRoot, path), { recursive: true });
  }

  for (const [path, source] of files) {
    await copyFile(source, join(staticRoot, path));
  }

  await writeFile(join(destination, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

  return config;
}

if (import.meta.main) {
  const [selected, output, ...retained] = process.argv.slice(2);

  if (!selected || !output) {
    throw new Error('Usage: bun scripts/prepare-vercel.ts <selected-site-directory> <output-directory> [retained-site-directory ...]');
  }

  await prepareVercel(selected, output, retained);
}
