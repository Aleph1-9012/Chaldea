import { expect, test } from 'bun:test';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { prepareVercel } from '../scripts/prepare-vercel';

async function fixture(root: string, name: string): Promise<string> {
  const directory = join(root, name);
  const files = {
    'index.html': `<html>${name}</html>`,
    'catalog.json': JSON.stringify({ widgets: [name] }),
    'LICENSE.txt': 'Application license',
    'NOTICE.txt': 'Application notice',
    'THIRD_PARTY_LICENSES.txt': 'Dependency licenses',
    'licenses/faculty-glyphic.txt': 'Font license',
    'licenses/jetbrains-mono.txt': 'Font license',
    [`assets/${name}.js`]: `console.log('${name}')`,
    [`revisions/notes/${name}/preview/index.html`]: `<html>Preview ${name}</html>`,
    [`revisions/notes/${name}/Widget.qml`]: `Item { property string release: '${name}' }`,
    [`revisions/notes/${name}/README.md`]: `Use ${name}`,
  };

  for (const [path, contents] of Object.entries(files)) {
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await writeFile(join(directory, path), contents);
  }

  return directory;
}

test('assembly keeps the selected site and retains only old revisions and assets through rollback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-vercel-'));

  try {
    const previous = await fixture(root, 'previous');
    const selected = await fixture(root, 'selected');
    const output = join(root, 'forward');

    await writeFile(join(previous, 'old-only.html'), 'Old site page');
    await writeFile(join(selected, 'assets/shared.js'), 'Same immutable bytes');
    await writeFile(join(previous, 'assets/shared.js'), 'Same immutable bytes');
    await prepareVercel(selected, output, [previous]);

    const deployed = join(output, 'static');

    expect(await readFile(join(deployed, 'index.html'), 'utf8')).toBe('<html>selected</html>');
    expect(await readFile(join(deployed, 'catalog.json'), 'utf8')).toBe(await readFile(join(selected, 'catalog.json'), 'utf8'));
    expect(await readFile(join(deployed, 'assets/previous.js'), 'utf8')).toBe("console.log('previous')");
    expect(await readFile(join(deployed, 'assets/shared.js'), 'utf8')).toBe('Same immutable bytes');
    expect(await readFile(join(deployed, 'revisions/notes/previous/preview/index.html'), 'utf8')).toBe('<html>Preview previous</html>');
    expect(await readFile(join(deployed, 'revisions/notes/selected/Widget.qml'), 'utf8')).toContain('selected');
    await expect(access(join(deployed, 'old-only.html'))).rejects.toThrow();

    const rollback = join(root, 'rollback');

    await prepareVercel(previous, rollback, [selected]);
    expect(await readFile(join(rollback, 'static/index.html'), 'utf8')).toBe('<html>previous</html>');
    expect(await readFile(join(rollback, 'static/assets/selected.js'), 'utf8')).toBe("console.log('selected')");
    expect(await readFile(join(rollback, 'static/revisions/notes/selected/preview/index.html'), 'utf8')).toBe('<html>Preview selected</html>');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('conflicting retained bytes fail before creating output and existing output stays untouched', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-vercel-'));

  try {
    const selected = await fixture(root, 'selected');
    const previous = await fixture(root, 'previous');
    const output = join(root, 'output');

    await writeFile(join(previous, 'assets/selected.js'), 'Different bytes at the same immutable URL');
    await expect(prepareVercel(selected, output, [previous])).rejects.toThrow('Conflicting immutable site file: assets/selected.js');
    await expect(access(output)).rejects.toThrow();
    await mkdir(output);
    await writeFile(join(output, 'keep.txt'), 'Untouched');
    await expect(prepareVercel(selected, output)).rejects.toThrow();
    expect(await readFile(join(output, 'keep.txt'), 'utf8')).toBe('Untouched');
    await expect(access(join(output, 'static'))).rejects.toThrow();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('incomplete sites and symlinked input are rejected without creating output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-vercel-'));

  try {
    const selected = await fixture(root, 'selected');
    const previous = await fixture(root, 'previous');
    const output = join(root, 'output');

    await rm(join(selected, 'licenses/faculty-glyphic.txt'));
    await expect(prepareVercel(selected, output)).rejects.toThrow('Selected site is missing required file: licenses/faculty-glyphic.txt');
    await writeFile(join(selected, 'licenses/faculty-glyphic.txt'), 'Font license');
    await rm(join(selected, 'assets'), { recursive: true });
    await expect(prepareVercel(selected, output)).rejects.toThrow('Selected site is missing required directory: assets');
    await mkdir(join(selected, 'assets'));
    await symlink(join(previous, 'assets/previous.js'), join(selected, 'assets/link.js'));
    await expect(prepareVercel(selected, output)).rejects.toThrow('symlink');
    await rm(join(selected, 'assets/link.js'));
    await symlink(previous, join(root, 'linked-release'));
    await expect(prepareVercel(selected, output, [join(root, 'linked-release')])).rejects.toThrow('symlink');
    await symlink(join(selected, 'revisions'), join(previous, 'revisions/link'));
    await expect(prepareVercel(selected, output, [previous])).rejects.toThrow('symlink');
    await expect(access(output)).rejects.toThrow();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('output config applies static headers and plain-text overrides without an HTML fallback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-vercel-'));

  try {
    const selected = await fixture(root, 'selected');
    const output = join(root, 'output');

    const config = await prepareVercel(selected, output);

    function headersFor(path: string): Record<string, string> {
      const headers: Record<string, string> = {};

      for (const route of config.routes) {
        if (route.src && new RegExp(route.src).test(path)) Object.assign(headers, route.headers);
      }

      return headers;
    }

    expect(config.version).toBe(3);
    expect(JSON.parse(await readFile(join(output, 'config.json'), 'utf8'))).toEqual(config);

    for (const path of ['/', '/index.html', '/catalog.json', '/deployment.json']) {
      expect(headersFor(path)).toEqual({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    }

    for (const path of ['/assets/selected.js', '/revisions/notes/selected/preview/index.html']) {
      expect(headersFor(path)).toEqual({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' });
    }

    expect(headersFor('/LICENSE.txt')).toEqual({ 'X-Content-Type-Options': 'nosniff' });
    expect(headersFor('/missing.html')).toEqual({ 'X-Content-Type-Options': 'nosniff' });
    expect(config.routes.at(-1)).toEqual({ handle: 'filesystem' });
    expect(config.routes.some(route => 'dest' in route)).toBe(false);
    expect(config.overrides['revisions/notes/selected/Widget.qml']).toEqual({ contentType: 'text/plain; charset=utf-8' });
    expect(config.overrides['revisions/notes/selected/README.md']).toEqual({ contentType: 'text/plain; charset=utf-8' });
    expect(config.overrides['revisions/notes/selected/preview/index.html']).toBeUndefined();
  } finally { await rm(root, { recursive: true, force: true }); }
});
