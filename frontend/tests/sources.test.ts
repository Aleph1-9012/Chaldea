import { expect, test } from 'bun:test';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWidget, widgetSources, writeThumbnail } from '../scripts/widget-sources';

const entry = { id: 'stable-id', path: 'notes/study/new-design', thumbnailSource: 'images/card.webp' };
const index = { formatVersion: 1, sourceRoot: 'widgets', widgets: [entry] };

test('packaged source index supplies selectors and thumbnail destinations without reading sources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-library-'));

  try {
    // The fixture has no widgets directory; every source detail comes from Rust's index.
    await writeFile(join(root, 'source-index.json'), JSON.stringify(index));

    const sources = await widgetSources(root, root);

    expect(sources).toEqual([{ ...entry, dir: join(root, 'widgets/notes/study/new-design') }]);
    expect(findWidget(sources, 'stable-id')).toEqual(findWidget(sources, 'notes/study/new-design'));
    expect(findWidget(sources, 'widgets/notes/study/new-design/')).toEqual(sources[0]!);
    expect(() => findWidget(sources, 'missing')).toThrow();
    await writeFile(join(root, 'source-index.json'), JSON.stringify({ ...index, sourceRoot: 'library', widgets: [{ ...entry, path: '' }] }));
    expect(await widgetSources(root, root)).toEqual([{ ...entry, path: '', dir: join(root, 'library') }]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('source index rejects invalid mappings and duplicate identities or paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-library-'));

  const invalid = [
    { ...index, formatVersion: 2 },
    { ...index, sourceRoot: '../widgets' },
    { ...index, widgets: [{ ...entry, id: 'Bad ID' }] },
    { ...index, widgets: [{ ...entry, path: '/tmp/widget' }] },
    { ...index, widgets: [{ ...entry, path: 'notes/../private' }] },
    { ...index, widgets: [{ ...entry, thumbnailSource: '../../shared.webp' }] },
    { ...index, widgets: [{ id: entry.id, path: entry.path }] },
    { ...index, widgets: [entry, { ...entry, path: 'other/path' }] },
    { ...index, widgets: [entry, { ...entry, id: 'other-id' }] },
  ];

  try {
    for (const value of invalid) {
      await writeFile(join(root, 'source-index.json'), JSON.stringify(value));
      await expect(widgetSources(root, root)).rejects.toThrow('Run make content');
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('thumbnail capture creates and replaces a nested local override without changing shared files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-thumbnail-'));
  const dir = join(root, 'widget');
  const shared = join(root, '_shared/images/card.webp');
  const source = { ...entry, dir };

  try {
    await mkdir(dir);
    await mkdir(join(root, '_shared/images'), { recursive: true });
    await writeFile(shared, 'shared');

    const destination = await writeThumbnail(source, new TextEncoder().encode('first'));

    expect(destination).toBe(join(dir, 'images/card.webp'));
    expect(await readFile(destination, 'utf8')).toBe('first');
    await writeThumbnail(source, new TextEncoder().encode('replacement'));
    expect(await readFile(destination, 'utf8')).toBe('replacement');
    expect(await readFile(shared, 'utf8')).toBe('shared');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('thumbnail capture rejects symlinked destinations and paths outside the widget', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-thumbnail-'));
  const dir = join(root, 'widget');
  const outside = join(root, 'outside');
  const bytes = new TextEncoder().encode('captured');

  try {
    await mkdir(dir);
    await mkdir(outside);
    await symlink(outside, join(dir, 'images'));
    await expect(writeThumbnail({ ...entry, dir }, bytes)).rejects.toThrow('symlink');
    await expect(access(join(outside, 'card.webp'))).rejects.toThrow();
    await rm(join(dir, 'images'));
    await mkdir(join(dir, 'images'));
    await writeFile(join(outside, 'card.webp'), 'untouched');
    await symlink(join(outside, 'card.webp'), join(dir, 'images/card.webp'));
    await expect(writeThumbnail({ ...entry, dir }, bytes)).rejects.toThrow('symlink');
    await expect(writeThumbnail({ ...entry, dir, thumbnailSource: '../outside/card.webp' }, bytes)).rejects.toThrow('inside its widget folder');
    await symlink(dir, join(root, 'linked-widget'));
    await expect(writeThumbnail({ ...entry, dir: join(root, 'linked-widget') }, bytes)).rejects.toThrow('symlink');
    expect(await readFile(join(outside, 'card.webp'), 'utf8')).toBe('untouched');
  } finally { await rm(root, { recursive: true, force: true }); }
});
