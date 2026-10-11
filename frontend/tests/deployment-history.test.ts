import { expect, test } from 'bun:test';
import { access, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { recordHistory, restoreHistory } from '../scripts/deployment-history';
import { prepareVercel } from '../scripts/prepare-vercel';

const sourceCommit = 'a'.repeat(40);

async function fixture(root: string, name: string): Promise<string> {
  const directory = join(root, name);
  const files = {
    'index.html': `<html>${name}</html>`,
    'catalog.json': '{}',
    'LICENSE.txt': 'Application license',
    'NOTICE.txt': 'Application notice',
    'THIRD_PARTY_LICENSES.txt': 'Dependency licenses',
    'licenses/faculty-glyphic.txt': 'Font license',
    'licenses/jetbrains-mono.txt': 'Font license',
    [`assets/${name}.js`]: `console.log('${name}')`,
    [`revisions/widget/${name}/bundle.json`]: JSON.stringify({ name }),
  };

  for (const [path, contents] of Object.entries(files)) {
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await writeFile(join(directory, path), contents);
  }

  return directory;
}

test('deployment history restores exact bytes and retains untagged files through deployment and rollback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-history-'));
  const previous = await fixture(root, 'previous');
  const selected = await fixture(root, 'selected');
  let served = previous;
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) { return new Response(Bun.file(join(served, new URL(request.url).pathname))); },
  });

  try {
    const first = await recordHistory(previous, sourceCommit);

    expect(first.files.map(file => file.path)).toEqual([
      'assets/previous.js', 'revisions/widget/previous/bundle.json',
    ]);

    const restored = join(root, 'restored');

    expect(await restoreHistory(server.url.href, restored)).toEqual(first);
    expect(await readFile(join(restored, 'deployment.json'))).toEqual(await readFile(join(previous, 'deployment.json')));
    await expect(access(join(restored, 'index.html'))).rejects.toThrow();
    await prepareVercel(selected, join(root, 'deployment'), [restored]);
    served = join(root, 'deployment/static');

    const combined = await recordHistory(served, 'b'.repeat(40));

    expect(combined.files).toHaveLength(4);

    const retained = join(root, 'retained');

    await restoreHistory(server.url.href, retained);
    // A source build of an older commit is sufficient for rollback; it needs no release.
    const rollbackSource = await fixture(root, 'rollback-source');

    await prepareVercel(rollbackSource, join(root, 'rollback'), [retained]);

    const rollback = join(root, 'rollback/static');
    const history = await recordHistory(rollback, sourceCommit);

    expect(history.files).toHaveLength(6);
    expect(await readFile(join(rollback, 'assets/selected.js'), 'utf8')).toBe("console.log('selected')");
    expect(await readFile(join(rollback, 'revisions/widget/previous/bundle.json'), 'utf8')).toBe('{"name":"previous"}');
    expect(await readFile(join(rollback, 'index.html'), 'utf8')).toBe('<html>rollback-source</html>');
  } finally {
    server.stop(true);
    await rm(root, { recursive: true, force: true });
  }
});

test('restoration rejects missing manifests, invalid paths, duplicates, and conflicting paths before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-history-'));
  const site = await fixture(root, 'site');
  const valid = await recordHistory(site, sourceCommit);
  let body = JSON.stringify(valid);
  let status = 404;
  let requests = 0;
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch() { requests++; return new Response(body, { status }); },
  });
  const output = join(root, 'restored');

  try {
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('(404)');
    status = 200;

    for (const path of ['assets/../outside', '/assets/app.js', 'assets/%2e%2e/outside', 'assets/a?x', 'assets/a#x', 'assets/a\\b', 'assets/.hidden', 'other/app.js']) {
      body = JSON.stringify({ ...valid, files: [{ ...valid.files[0], path }, valid.files[1]] });
      requests = 0;
      await expect(restoreHistory(server.url.href, output)).rejects.toThrow('Invalid deployment history');
      expect(requests).toBe(1);
      await expect(access(output)).rejects.toThrow();
    }

    body = JSON.stringify({ ...valid, files: [...valid.files, valid.files[0]] });
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('Duplicate history path');
    body = JSON.stringify({ ...valid, files: [...valid.files, { ...valid.files[0], path: 'assets/site.js/child' }] });
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('Conflicting history path');
    body = JSON.stringify({ ...valid, sourceCommit: 'main' });
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('Invalid deployment history');
    body = JSON.stringify({ ...valid, files: [{ ...valid.files[0], path: 'assets/first' }, { ...valid.files[1], path: 'assets/second' }] });
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('History is missing revisions');
    await expect(access(output)).rejects.toThrow();
  } finally {
    server.stop(true);
    await rm(root, { recursive: true, force: true });
  }
});

test('failed file verification removes incomplete output and existing output is never replaced', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-history-'));
  const site = await fixture(root, 'site');
  const valid = await recordHistory(site, sourceCommit);
  let files = valid.files;
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;

      if (path === '/deployment.json') return Response.json({ ...valid, files });

      return new Response(Bun.file(join(site, path)));
    },
  });
  const output = join(root, 'restored');

  try {
    files = valid.files.map(file => file.path.startsWith('assets/') ? { ...file, sha256: '0'.repeat(64) } : file);
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('History hash mismatch');
    await expect(access(output)).rejects.toThrow();
    files = valid.files.map(file => ({ ...file, size: file.size + 1 }));
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('History size mismatch');
    await expect(access(output)).rejects.toThrow();
    files = valid.files.map(file => ({ ...file, size: file.size - 1 }));
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow('size limit');
    await expect(access(output)).rejects.toThrow();
    expect((await readdir(root)).some(name => name.startsWith('.chaldea-history-'))).toBe(false);
    files = valid.files;
    await mkdir(output);
    await writeFile(join(output, 'keep.txt'), 'Untouched');
    await expect(restoreHistory(server.url.href, output)).rejects.toThrow();
    expect(await readFile(join(output, 'keep.txt'), 'utf8')).toBe('Untouched');
    await expect(access(join(output, 'deployment.json'))).rejects.toThrow();
  } finally {
    server.stop(true);
    await rm(root, { recursive: true, force: true });
  }
});

test('recording rejects symlinks and preserves existing manifests', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-history-'));

  try {
    const site = await fixture(root, 'site');

    await symlink(join(site, 'assets/site.js'), join(site, 'assets/linked.js'));
    await expect(recordHistory(site, sourceCommit)).rejects.toThrow('symlink');
    await expect(access(join(site, 'deployment.json'))).rejects.toThrow();
    await rm(join(site, 'assets/linked.js'));
    await expect(recordHistory(site, 'main')).rejects.toThrow('Invalid deployment history');
    await recordHistory(site, sourceCommit);

    const original = await readFile(join(site, 'deployment.json'));

    await expect(recordHistory(site, 'b'.repeat(40))).rejects.toThrow();
    expect(await readFile(join(site, 'deployment.json'))).toEqual(original);
    expect((await readdir(site)).some(name => name.startsWith('.chaldea-history-'))).toBe(false);
    await symlink(site, join(root, 'linked-site'));
    await expect(recordHistory(join(root, 'linked-site'), sourceCommit)).rejects.toThrow('symlink');
  } finally { await rm(root, { recursive: true, force: true }); }
});
