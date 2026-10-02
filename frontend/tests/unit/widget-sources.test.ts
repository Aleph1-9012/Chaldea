import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWidget, selectWidgets, widgetSources } from '../../scripts/widget-sources';

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'chaldea-sources-'));
  try {
    for (const [path, id] of [['glyphs/branch', 'stable-branch'], ['glyphs/relay', 'stable-relay'], ['notes/refined', 'stable-notes']] as const) {
      await mkdir(join(root, path), { recursive: true });
      await writeFile(join(root, path, 'widget.json'), JSON.stringify({ id, category: path.split('/')[0] }));
    }
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('source lookup and focused checks resolve stable IDs, short paths, and groups', async () => {
  await fixture(async root => {
    const sources = await widgetSources(root);
    expect(findWidget(sources, 'stable-branch')).toEqual(findWidget(sources, 'widgets/glyphs/branch/'));
    expect(selectWidgets(sources, '', 'glyphs').map(source => source.id)).toEqual(['stable-branch', 'stable-relay']);
    expect(selectWidgets(sources, 'notes/refined', '').map(source => source.id)).toEqual(['stable-notes']);
    expect(() => selectWidgets(sources, '', 'missing')).toThrow('Unknown widget group');
    expect(() => selectWidgets(sources, 'stable-branch', 'glyphs')).toThrow('not both');
    expect(() => findWidget(sources, '../notes')).toThrow('Unknown widget');
  });
});

test('source discovery rejects duplicate identities and symlink groups', async () => {
  await fixture(async root => {
    await writeFile(join(root, 'glyphs/relay/widget.json'), JSON.stringify({ id: 'stable-branch', category: 'glyphs' }));
    await expect(widgetSources(root)).rejects.toThrow('Duplicate widget ID');
    await writeFile(join(root, 'glyphs/relay/widget.json'), JSON.stringify({ id: 'stable-relay', category: 'glyphs' }));
    await symlink(root, join(root, 'loop'));
    await expect(widgetSources(root)).rejects.toThrow('symlinks');
  });
});
