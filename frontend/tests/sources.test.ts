import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWidget, widgetSources } from '../scripts/widget-sources';

test('new nested widget folders are discovered without editing a test inventory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-library-'));
  try {
    const dir = join(root, 'notes/study/new-design');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'widget.json'), JSON.stringify({ id: 'stable-id', category: 'Notes' }));
    const sources = await widgetSources(root);
    expect(sources).toHaveLength(1);
    expect(findWidget(sources, 'stable-id')).toEqual(findWidget(sources, 'notes/study/new-design'));
    expect(() => findWidget(sources, 'missing')).toThrow();
    await mkdir(join(root, 'duplicate'));
    await writeFile(join(root, 'duplicate/widget.json'), JSON.stringify({ id: 'stable-id', category: 'Notes' }));
    await expect(widgetSources(root)).rejects.toThrow('Duplicate widget ID');
    await rm(join(root, 'duplicate'), { recursive: true });
    await symlink(root, join(root, 'loop'));
    await expect(widgetSources(root)).rejects.toThrow('symlinks');
  } finally { await rm(root, { recursive: true, force: true }); }
});
