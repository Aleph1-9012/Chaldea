import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, copyFile, chmod, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { exportWidget, loadLocal } from './export';

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9-]+$/.test(id)) throw new Error('Provide a widget ID.');
const root = resolve(import.meta.dir, '../..');
const content = join(root, 'build/content');
const { bundle } = await loadLocal(content, id);
if (!bundle.definition.exports.some(f => f.path === 'shell.qml')) throw new Error('Native checks require an exported shell.qml.');
const output = join(root, 'build/native'); await mkdir(output, { recursive: true });
const run = await mkdtemp(join(output, `${id}-`));
const runtime = await mkdtemp(join(tmpdir(), 'xlr8-qs-')); await chmod(runtime, 0o700);
const environment: Record<string, string | undefined> = { ...process.env, QT_QPA_PLATFORM: 'offscreen', QT_QUICK_BACKEND: 'software', XDG_RUNTIME_DIR: runtime, XDG_CACHE_HOME: join(run, 'cache') };
delete environment.WAYLAND_DISPLAY; delete environment.DISPLAY;
const qtTool = (name: string) => process.env[name.toUpperCase()] ?? (existsSync(`/usr/lib/qt6/bin/${name}`) ? `/usr/lib/qt6/bin/${name}` : name);
function command(program: string, args: string[], cwd: string): string {
  const result = spawnSync(program, args, { cwd, env: environment, encoding: 'utf8', timeout: 20000 });
  const log = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.error || result.status !== 0) throw new Error(`${program} failed: ${result.error?.message ?? log}`);
  return log;
}
async function quickshell(cwd: string): Promise<string> {
  return new Promise((accept, reject) => {
    const child = spawn(process.env.QUICKSHELL ?? 'qs', ['--no-color', '-p', join(cwd, 'shell.qml')], { cwd, env: environment });
    let output = '', ready = false, finished = false;
    const timer = setTimeout(() => { finished = true; child.kill('SIGTERM'); reject(new Error(`Quickshell did not load: ${output}`)); }, 8000);
    const read = (data: Buffer) => {
      output += data.toString();
      if (output.includes('Configuration Loaded') && !ready) {
        ready = true; setTimeout(() => { if (!finished) child.kill('SIGTERM'); }, 800);
      }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
    child.on('error', error => { clearTimeout(timer); finished = true; reject(error); });
    child.on('close', () => {
      clearTimeout(timer); if (finished) return; finished = true;
      if (!ready || /\bERROR\b|ReferenceError|TypeError|failed to load/i.test(output)) reject(new Error(output));
      else accept(output);
    });
  });
}
const low: Record<string, unknown> = {}, high: Record<string, unknown> = {};
for (const setting of bundle.definition.settings) {
  switch (setting.type) {
    case 'number': low[setting.key] = setting.min; high[setting.key] = setting.min + Math.floor((setting.max - setting.min) / setting.step) * setting.step; break;
    case 'boolean': low[setting.key] = false; high[setting.key] = true; break;
    case 'enum': low[setting.key] = setting.choices[0]; high[setting.key] = setting.choices.at(-1); break;
    case 'color': low[setting.key] = '#4d8368'; high[setting.key] = '#d5b785'; break;
    case 'string': low[setting.key] = ''; high[setting.key] = 'Quote " / \\ / 継'.slice(0, setting.maxLength); break;
  }
}
const logs: string[] = [];
try {
  for (const [name, values] of [['defaults', {}], ['minimum', low], ['maximum', high]] as const) {
    const directory = join(run, name);
    const snapshot = await exportWidget(content, id, directory, values);
    const qml = snapshot.files.filter(f => f.path.endsWith('.qml')).map(f => f.path);
    logs.push(command(qtTool('qmllint'), ['--ignore-settings', ...qml], directory));
    const colors = JSON.stringify(bundle.definition.settings.filter(s => s.type === 'color').map(s => s.key));
    const expected = JSON.stringify(snapshot.settings).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    await writeFile(join(directory, 'tst_Export.qml'), `import QtQuick\nimport QtTest\nItem { width: 640; height: 400\n Widget { id: widget; anchors.centerIn: parent }\n TestCase { name: "ExportedValues"; when: windowShown\n function test_values() { var expected = (${expected}); for (var key in expected) { if (${colors}.indexOf(key) !== -1) compare(String(widget[key]), expected[key]); else compare(widget[key], expected[key]); } }\n function test_render() { var saved = false; verify(widget.grabToImage(function(result) { saved = result.saveToFile(${JSON.stringify(join(directory, 'render.png'))}); })); tryVerify(function() { return saved; }, 4000); }\n }\n}\n`);
    const behavioral = join(root, 'widgets', id, 'native/tst_Behavior.qml');
    if (existsSync(behavioral)) await copyFile(behavioral, join(directory, 'tst_Behavior.qml'));
    logs.push(command(qtTool('qmltestrunner'), ['-input', directory], directory));
    logs.push(await quickshell(directory));
    console.log(`Native ${id}/${name}: lint, values, render${existsSync(behavioral) ? ', behavior' : ''}, Quickshell load passed`);
  }
  await writeFile(join(run, 'verification.txt'), `${command(process.env.QUICKSHELL ?? 'qs', ['--version'], run)}\n${command(qtTool('qmllint'), ['--version'], run)}\nRevision: ${bundle.revision}\nMode: Qt offscreen, software rendering. Desktop integrations are not tested.\n\n${logs.join('\n')}`);
  console.log(`Native evidence: ${run}`);
} finally {
  await rm(runtime, { recursive: true, force: true });
}
