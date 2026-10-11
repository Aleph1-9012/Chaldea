import Ajv from 'ajv';
import { createHash } from 'node:crypto';
import { link, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import historySchema from '../../schemas/deployment-history.schema.json';

type HistoryFile = { path: string; sha256: string; size: number };

type DeploymentHistory = { formatVersion: 1; sourceCommit: string; files: HistoryFile[] };

const validateHistory = new Ajv({ allErrors: true }).compile<DeploymentHistory>(historySchema);
const immutableDirectories = ['assets', 'revisions'];
const manifestLimit = 32 * 1024 * 1024;
const fileLimit = 64 * 1024 * 1024;

function checkHistory(history: DeploymentHistory): void {
  const paths = new Set<string>();

  for (const file of history.files) {
    if (paths.has(file.path)) throw new Error(`Duplicate history path: ${file.path}`);

    paths.add(file.path);
  }

  for (const path of paths) {
    let parent = dirname(path);

    while (parent !== '.') {
      if (paths.has(parent)) throw new Error(`Conflicting history path: ${parent}`);

      parent = dirname(parent);
    }
  }

  for (const directory of immutableDirectories) {
    if (!history.files.some(file => file.path.startsWith(`${directory}/`))) {
      throw new Error(`History is missing ${directory} files`);
    }
  }
}

async function checkDirectory(path: string): Promise<void> {
  if (await realpath(path) !== path) throw new Error(`History path includes a symlink: ${path}`);
  if (!(await lstat(path)).isDirectory()) throw new Error(`Expected a directory: ${path}`);
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function download(url: URL, limit: number, signal: AbortSignal): Promise<Buffer> {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]) });

  if (!response.ok || !response.body) throw new Error(`Could not restore ${url.pathname} (${response.status})`);

  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let size = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) break;

      size += chunk.value.byteLength;

      if (size > limit) throw new Error(`History response exceeds its size limit: ${url.pathname}`);

      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }

  return Buffer.concat(chunks, size);
}

export async function restoreHistory(origin: string, output: string): Promise<DeploymentHistory> {
  const base = new URL(origin);

  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('History origin must be an HTTP(S) URL without credentials, query, or fragment');
  }

  if (!base.pathname.endsWith('/')) base.pathname += '/';

  const controller = new AbortController();
  const manifest = await download(new URL('deployment.json', base), manifestLimit, controller.signal);
  const history: unknown = JSON.parse(manifest.toString('utf8'));

  if (!validateHistory(history)) throw new Error(`Invalid deployment history: ${validateHistory.errors?.[0]?.message}`);

  checkHistory(history);

  const destination = resolve(output);

  await mkdir(dirname(destination), { recursive: true });
  await checkDirectory(dirname(destination));
  // Reserve the destination exclusively; only a complete verified tree replaces it.
  await mkdir(destination);

  let staging: string | undefined;

  try {
    staging = await mkdtemp(join(dirname(destination), '.chaldea-history-'));
    const stagingRoot = staging;
    const pending = history.files.values();

    for (const directory of immutableDirectories) await mkdir(join(stagingRoot, directory));

    async function worker(): Promise<void> {
      for (const file of pending) {
        const bytes = await download(new URL(file.path, base), file.size, controller.signal);

        if (bytes.byteLength !== file.size) throw new Error(`History size mismatch: ${file.path}`);
        if (digest(bytes) !== file.sha256) throw new Error(`History hash mismatch: ${file.path}`);

        const target = join(stagingRoot, file.path);

        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, bytes, { flag: 'wx' });
      }
    }

    const workers = Array.from({ length: Math.min(8, history.files.length) }, async () => {
      try { await worker(); }
      catch (cause) { controller.abort(); throw cause; }
    });
    const results = await Promise.allSettled(workers);
    const failed = results.find(result => result.status === 'rejected');

    if (failed?.status === 'rejected') throw failed.reason;

    await writeFile(join(stagingRoot, 'deployment.json'), manifest, { flag: 'wx' });
    await rename(stagingRoot, destination);
    staging = undefined;

    return history;
  } catch (cause) {
    await rm(destination, { recursive: true, force: true });

    throw cause;
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true });
  }
}

export async function recordHistory(staticRoot: string, sourceCommit: string): Promise<DeploymentHistory> {
  const root = resolve(staticRoot);
  const files: HistoryFile[] = [];

  await checkDirectory(root);

  async function collect(path: string): Promise<void> {
    const source = join(root, path);
    const metadata = await lstat(source);

    if (metadata.isSymbolicLink()) throw new Error(`History contains a symlink: ${source}`);

    if (metadata.isDirectory()) {
      for (const name of await readdir(source)) await collect(`${path}/${name}`);

      return;
    }

    if (!metadata.isFile()) throw new Error(`History contains a non-file entry: ${source}`);
    if (metadata.size > fileLimit) throw new Error(`History file exceeds its size limit: ${path}`);

    const bytes = await readFile(source);

    files.push({ path, sha256: digest(bytes), size: bytes.byteLength });
  }

  for (const directory of immutableDirectories) {
    await checkDirectory(join(root, directory));
    await collect(directory);
  }

  files.sort((left, right) => left.path.localeCompare(right.path, 'en'));

  const history = { formatVersion: 1, sourceCommit, files } satisfies DeploymentHistory;

  if (!validateHistory(history)) throw new Error(`Invalid deployment history: ${validateHistory.errors?.[0]?.message}`);

  checkHistory(history);

  const manifest = `${JSON.stringify(history, null, 2)}\n`;

  if (Buffer.byteLength(manifest) > manifestLimit) throw new Error('Deployment history exceeds its size limit');

  const staging = await mkdtemp(join(root, '.chaldea-history-'));

  try {
    const temporary = join(staging, 'deployment.json');

    await writeFile(temporary, manifest, { flag: 'wx' });
    // A hard link publishes complete bytes atomically without replacing an existing manifest.
    await link(temporary, join(root, 'deployment.json'));
  } finally { await rm(staging, { recursive: true, force: true }); }

  return history;
}

if (import.meta.main) {
  const [command, first, second, ...extra] = process.argv.slice(2);

  if (!command || !first || !second || extra.length || !['restore', 'record'].includes(command)) {
    throw new Error('Usage: bun scripts/deployment-history.ts restore <origin> <new-history-directory> | record <static-directory> <source-commit>');
  }

  if (command === 'restore') await restoreHistory(first, second);
  else await recordHistory(first, second);
}
