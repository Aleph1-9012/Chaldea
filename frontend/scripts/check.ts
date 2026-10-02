import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { repository, selectWidgets, widgetSources } from './widget-sources';

const [scope = 'all', widget = '', group = ''] = process.argv.slice(2);
const frontend = join(repository, 'frontend');
function run(command: string, args: string[], cwd = repository, environment = process.env) {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function bun(args: string[], environment = process.env) { run(process.execPath, args, frontend, environment); }
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (!['all', 'core'].includes(scope)) throw new Error('SCOPE must be all or core.');
if ((widget || group) && scope !== 'all') throw new Error('Use SCOPE=core separately from WIDGET or GROUP.');

if (widget || group) {
  const selected = selectWidgets(await widgetSources(), widget, group);
  const ids = selected.map(source => source.id);
  console.log(`Checking ${selected.length} widget(s): ${selected.map(source => source.path).join(', ')}`);
  run('make', ['content']);
  if (ids.includes('tsugumori-fish-in-space')) bun(['test', 'tests/unit/fish-motion.test.js']);
  // Archive smoke tests filter their entries before batching. Other tests use
  // the stable widget ID in their name, including the native notes browser tests.
  const pattern = `^(?:${ids.map(escapePattern).join('|')}):|^archive `;
  bun(['test', '--timeout', '25000', 'tests/browser', '--test-name-pattern', pattern], {
    ...process.env, CHALDEA_TEST_WIDGETS: JSON.stringify(ids),
  });
} else {
  run('make', ['_check-code', scope === 'core' ? '_check-content' : 'content']);
  bun(['test', ...(scope === 'core'
    ? ['tests/unit/generator.test.ts', 'tests/unit/widget-sources.test.ts']
    : ['tests/unit'])]);
  if (scope === 'all') bun(['run', 'test:browser'], { ...process.env, CHALDEA_TEST_WIDGETS: '' });
}
