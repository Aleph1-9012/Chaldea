import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import Ajv from 'ajv';
import controlsSchema from '../../schemas/preview-controls.schema.json';
import hostSchema from '../../schemas/preview-host.schema.json';
import { generatePreviewRuntime } from '../scripts/build-preview-runtime';
import type { Settings } from '../src/catalog/contracts';
import { checkAction, interactionKind, validInteractionState } from '../src/preview/interactions';
import type { InteractionControl, InteractionState, InteractionValue } from '../src/preview/interactions';

const envelope = { channel: 'chaldea:preview', token: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } as const;
const checkState = new Ajv().compile<InteractionState>(controlsSchema);
const checkHost = new Ajv({ strict: false, strictNumbers: true }).compile(hostSchema);

const range = { type: 'range', key: 'amount', label: 'Amount', hidden: false, disabled: false, min: 0, max: 10, step: 2, value: 4 } satisfies InteractionControl;
const choice = { type: 'select', key: 'mode', label: 'Mode', hidden: false, disabled: false, value: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } satisfies InteractionControl;
const text = { type: 'text', key: 'name', label: 'Name', hidden: false, disabled: false, value: 'test', maxLength: 4 } satisfies InteractionControl;
const button = { type: 'button', key: 'capture', label: 'Keep', hidden: false, disabled: false } satisfies InteractionControl;

function state(): InteractionState {
  return {
    controls: [range, choice, text, button, { ...button, key: 'hidden', hidden: true }, { ...button, key: 'disabled', disabled: true }],
    archives: [{ key: 'archive:0', label: 'Kept form' }],
    status: 'Ready',
    paused: false,
  };
}

interface HostMessage {
  channel: string; token: string; type: string; externalControls?: boolean;
  sequence?: number; revision?: number; kind?: string; key?: string;
  value?: InteractionValue; settings?: Settings;
}

type RuntimeOutput = { channel: string; token: string } & (
  | { type: 'ready' | 'error' | 'controls-unavailable' }
  | { type: 'resize'; height: number; width?: number }
  | { type: 'rendered'; sequence: number }
  | { type: 'controls'; state: InteractionState; revision: number; ack: number }
  | { type: 'focus'; key: string; sequence: number }
  | { type: 'action-error'; sequence: number; message: string }
);

interface RuntimeParent { postMessage(message: RuntimeOutput): void }

type RuntimeListener = (event: { source: RuntimeParent; data: HostMessage }) => void;
type EngineAction = (key: string, value?: InteractionValue) => string | void;

interface RuntimeApi {
  controlsChanged(): void;
  connect(render: (settings: Settings) => void, interactions?: {
    read(): InteractionState; action: EngineAction; pause(value: boolean): void; hosted(value: boolean): void; escape?(): void;
  }): () => void;
}

interface RuntimeWindow {
  parent: RuntimeParent; ChaldeaPreview?: RuntimeApi;
  addEventListener(type: string, listener: RuntimeListener): void;
  removeEventListener(type: string, listener: RuntimeListener): void;
}

async function runtimeFixture(action: EngineAction = () => undefined, withControls = true) {
  const messages: RuntimeOutput[] = [];
  const listeners = new Map<string, Set<RuntimeListener>>();
  const rendered: Settings[] = [];
  const actions: { key: string; value?: InteractionValue }[] = [];
  const hosted: boolean[] = [];
  const current = state();
  const parent = { postMessage(message: RuntimeOutput) { messages.push(message); } };
  const body = { dataset: { previewWidth: '' }, getBoundingClientRect: () => ({ height: 321.2 }) };
  let escaped = 0;

  const window: RuntimeWindow = {
    parent,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());

      listeners.get(type)!.add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
  };

  new Script(await generatePreviewRuntime()).runInNewContext({
    window,
    document: { body },
    ResizeObserver: class { observe() {} disconnect() {} },
  });

  const api = window.ChaldeaPreview;

  if (!api) throw new Error('Runtime did not expose ChaldeaPreview.');

  const interactions = {
    read: () => current,
    action(key: string, value?: InteractionValue) { actions.push({ key, value }); return action(key, value); },
    pause(value: boolean) { current.paused = value; },
    hosted(value: boolean) { hosted.push(value); },
    escape() { escaped++; current.canEscape = false; },
  };

  const disconnect = api.connect(settings => rendered.push(settings), withControls ? interactions : undefined);

  return {
    current, messages, rendered, actions, hosted, disconnect, body,
    get escaped() { return escaped; },
    changed: () => api.controlsChanged(),
    send(data: HostMessage, source = parent) {
      for (const listener of listeners.get('message') ?? []) listener({ source, data });
    },
    latest() {
      const snapshot = messages.filter(message => message.type === 'controls').at(-1);

      if (!snapshot || snapshot.type !== 'controls') throw new Error('No control snapshot was published.');

      return snapshot;
    },
  };
}

function command(sequence: number, kind: string, key: string, value?: InteractionValue): HostMessage {
  return { ...envelope, type: 'action', sequence, kind, key, value };
}

test('checked-in preview runtime matches deterministic standalone generation', async () => {
  const generated = await generatePreviewRuntime();

  expect(await readFile(new URL('../src/preview/runtime.js', import.meta.url), 'utf8')).toBe(generated);
  expect(await generatePreviewRuntime()).toBe(generated);
});

test('preview protocol validators reject malformed messages and ambiguous controls', () => {
  for (const message of [command(1, 'button', 'capture'), command(1, 'range', 'amount', 4), command(1, 'select', 'mode', 'a'), command(1, 'text', 'name', 'test'), command(1, 'archive', 'archive:0'), command(1, 'pause', 'preview:pause', true), command(1, 'escape', 'preview:escape')]) expect(checkAction(message)).toBe(true);
  for (const message of [command(0, 'button', 'capture'), command(1.5, 'button', 'capture'), command(1, 'button', 'capture', true), command(1, 'range', 'amount', '4'), command(1, 'range', 'amount', Infinity), command(1, 'range', 'amount', -Infinity), command(1, 'range', 'amount', NaN), command(1, 'select', 'mode', false), command(1, 'text', 'name', 'x'.repeat(1025)), command(1, 'escape', 'preview:escape', true), { ...command(1, 'button', 'capture'), extra: true }]) expect(checkAction(message)).toBe(false);

  for (const sequence of [NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(checkAction(command(sequence, 'button', 'capture'))).toBe(false);
    expect(checkHost({ ...envelope, type: 'settings', sequence, settings: {} })).toBe(false);
    expect(checkHost({ ...envelope, type: 'controls-mounted', revision: sequence })).toBe(false);
  }

  expect(checkAction(command(Number.MAX_SAFE_INTEGER, 'button', 'capture'))).toBe(true);

  const current = state();

  expect(checkState(current)).toBe(true);
  expect(checkState({ ...current, canEscape: true })).toBe(true);
  expect(checkState({ ...current, canEscape: 'true' })).toBe(false);
  expect(validInteractionState(current)).toBe(true);
  expect(checkState({ ...current, controls: [{ ...range, step: 0 }] })).toBe(false);
  expect(checkState({ ...current, controls: [{ ...button, label: '' }] })).toBe(false);
  expect(checkState({ ...current, archives: [{ key: 'archive:0', label: 'Saved', callback: 'execute' }] })).toBe(false);

  for (const controls of [[button, button], [{ ...range, value: 11 }], [{ ...choice, value: 'missing' }], [{ ...choice, options: [choice.options[0]!, choice.options[0]!] }], [{ ...text, value: 'longer' }], [{ ...button, key: 'preview:pause' }], [{ ...button, key: 'preview:escape' }]]) expect(validInteractionState({ ...current, controls })).toBe(false);

  expect(validInteractionState({ ...current, archives: [{ key: button.key, label: 'Conflicting' }] })).toBe(false);
  expect(interactionKind(current, 'capture')).toBe('button');
  expect(interactionKind(current, 'archive:0')).toBe('archive');
  expect(interactionKind(current, 'preview:pause')).toBe('pause');
  expect(interactionKind(current, 'preview:escape')).toBeUndefined();
  expect(interactionKind({ ...current, canEscape: false }, 'preview:escape')).toBeUndefined();
  expect(interactionKind({ ...current, canEscape: true }, 'preview:escape')).toBe('escape');
  expect(interactionKind(current, 'hidden')).toBeUndefined();
  expect(interactionKind(current, 'disabled')).toBeUndefined();
  expect(interactionKind(current, 'missing')).toBeUndefined();
});

test('runtime authenticates the parent and token, waits for mount acknowledgement, and keeps settings separate', async () => {
  const runtime = await runtimeFixture();
  const stranger = { postMessage() {} };
  const init = { ...envelope, type: 'init', externalControls: true };

  runtime.send(init, stranger);
  runtime.send({ ...init, token: 'invalid' });
  runtime.send({ ...envelope, type: 'settings', sequence: 1, settings: { accent: '#ffffff' } });
  expect(runtime.messages).toHaveLength(0);
  expect(runtime.rendered).toHaveLength(0);
  runtime.send(init);
  expect(runtime.messages[0]).toEqual({ ...envelope, type: 'ready' });
  expect(runtime.latest()).toMatchObject({ revision: 1, ack: 0, state: runtime.current });
  runtime.send(command(1, 'button', 'capture'));
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 2 });
  expect(runtime.actions).toHaveLength(0);
  expect(runtime.hosted).toHaveLength(0);
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 1 });
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 1 });
  expect(runtime.hosted).toEqual([true]);

  const settings = { ...envelope, type: 'settings', sequence: 1, settings: { accent: '#ffffff', detail: 3 } };

  runtime.send({ ...settings, token: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
  runtime.send(settings, stranger);
  runtime.send({ ...settings, sequence: Number.MAX_SAFE_INTEGER + 1 });
  runtime.send({ ...settings, settings: { detail: NaN } });
  runtime.send(settings);
  runtime.send({ ...settings, settings: { accent: '#000000' } });
  expect(runtime.rendered).toEqual([settings.settings]);
  expect(Object.isFrozen(runtime.rendered[0])).toBe(true);
  expect(runtime.messages).toContainEqual({ ...envelope, type: 'rendered', sequence: 1 });
  expect(runtime.messages).toContainEqual({ ...envelope, type: 'resize', height: 322 });
  runtime.send(command(Number.MAX_SAFE_INTEGER + 1, 'button', 'capture'));
  runtime.send(command(40, 'button', 'capture'));
  runtime.body.dataset.previewWidth = '468';
  runtime.send({ ...settings, sequence: 2 });
  expect(runtime.rendered).toHaveLength(2);
  expect(runtime.messages).toContainEqual({ ...envelope, type: 'resize', height: 322, width: 468 });
  expect(runtime.latest().ack).toBe(40);
  runtime.disconnect();
  runtime.send({ ...settings, sequence: 3 });
  runtime.changed();
  expect(runtime.rendered).toHaveLength(2);
  expect(runtime.hosted).toEqual([true, false]);
});

test('runtime enforces live control bounds, rejects action replays, and reports focus and acknowledgements', async () => {
  const runtime = await runtimeFixture(key => key === 'capture' ? 'name' : undefined);
  runtime.send({ ...envelope, type: 'init', externalControls: true });
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 1 });

  const rejected = [command(1, 'range', 'amount', 3), command(2, 'range', 'amount', 12), command(3, 'select', 'mode', 'missing'), command(4, 'text', 'name', 'longer'), command(5, 'button', 'hidden'), command(6, 'button', 'disabled'), command(7, 'archive', 'archive:9'), command(8, 'button', 'amount'), command(9, 'pause', 'wrong-key', true)];

  for (const action of rejected) runtime.send(action);

  expect(runtime.actions).toHaveLength(0);
  expect(runtime.latest().ack).toBe(9);
  runtime.send(command(10, 'range', 'amount', 6));
  runtime.send(command(10, 'range', 'amount', 8));
  runtime.send(command(9, 'button', 'capture'));
  runtime.send({ ...command(11, 'button', 'capture'), token: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
  runtime.send(command(11, 'button', 'capture'), { postMessage() {} });
  expect(runtime.actions).toEqual([{ key: 'amount', value: 6 }]);
  runtime.send(command(11, 'select', 'mode', 'b'));
  runtime.send(command(12, 'text', 'name', '🦊🦊🦊🦊'));
  runtime.send(command(13, 'archive', 'archive:0'));
  runtime.send(command(14, 'button', 'capture'));
  runtime.send(command(15, 'pause', 'preview:pause', true));
  expect(runtime.actions.map(action => action.key)).toEqual(['amount', 'mode', 'name', 'archive:0', 'capture']);
  expect(runtime.messages.filter(message =>
    (message.type === 'controls' && message.ack === 14) || message.type === 'focus',
  )).toEqual([
    expect.objectContaining({ ...envelope, type: 'controls', ack: 14 }),
    { ...envelope, type: 'focus', key: 'name', sequence: 14 },
  ]);
  expect(runtime.latest()).toMatchObject({ ack: 15, state: { paused: true } });
  runtime.send(command(14, 'button', 'capture'));
  expect(runtime.messages.filter(message => message.type === 'focus')).toEqual([{ ...envelope, type: 'focus', key: 'name', sequence: 14 }]);
  expect(runtime.rendered).toHaveLength(0);
  runtime.disconnect();
});

test('runtime applies Escape only while the live state advertises it', async () => {
  const runtime = await runtimeFixture();
  runtime.send({ ...envelope, type: 'init', externalControls: true });
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 1 });
  runtime.send(command(1, 'escape', 'preview:escape'));
  expect(runtime.escaped).toBe(0);
  expect(runtime.latest()).toMatchObject({ ack: 1, state: { canEscape: false } });

  runtime.current.canEscape = true;
  runtime.changed();
  expect(runtime.latest().state.canEscape).toBe(true);
  runtime.send(command(2, 'escape', 'wrong-key'));
  runtime.send(command(3, 'escape', 'preview:escape', true));
  expect(runtime.escaped).toBe(0);
  expect(runtime.latest().ack).toBe(2);

  runtime.send(command(3, 'escape', 'preview:escape'));
  expect(runtime.escaped).toBe(1);
  expect(runtime.latest()).toMatchObject({ ack: 3, state: { canEscape: false } });
  runtime.send(command(3, 'escape', 'preview:escape'));
  runtime.send(command(4, 'escape', 'preview:escape'));
  expect(runtime.escaped).toBe(1);
  expect(runtime.latest().ack).toBe(4);
  expect(runtime.actions).toHaveLength(0);
  runtime.disconnect();
});

test('runtime publishes changed collections and preserves standalone controls or restores them on failure', async () => {
  const standalone = await runtimeFixture();
  standalone.send({ ...envelope, type: 'init' });
  standalone.send(command(1, 'button', 'capture'));
  standalone.changed();
  expect(standalone.messages).toEqual([{ ...envelope, type: 'ready' }]);
  expect(standalone.hosted).toHaveLength(0);
  expect(standalone.actions).toHaveLength(0);
  standalone.disconnect();

  const basic = await runtimeFixture(() => undefined, false);
  basic.send({ ...envelope, type: 'init', externalControls: true });
  basic.send({ ...envelope, type: 'settings', sequence: 1, settings: { detail: 2 } });
  expect(basic.rendered).toEqual([{ detail: 2 }]);
  expect(basic.messages.some(message => message.type === 'controls')).toBe(false);
  basic.disconnect();

  const runtime = await runtimeFixture(() => { throw new Error('Engine rejected action'); });
  runtime.send({ ...envelope, type: 'init', externalControls: true });
  runtime.send({ ...envelope, type: 'controls-mounted', revision: 1 });
  runtime.changed();
  expect(runtime.latest().revision).toBe(1);
  runtime.current.archives[0]!.label = 'Renamed form';
  runtime.changed();
  expect(runtime.latest()).toMatchObject({ revision: 2, state: { archives: [{ key: 'archive:0', label: 'Renamed form' }] } });
  runtime.send(command(1, 'button', 'capture'));
  expect(runtime.messages.filter(message =>
    (message.type === 'controls' && message.ack === 1) || message.type === 'action-error',
  )).toEqual([
    expect.objectContaining({ ...envelope, type: 'controls', ack: 1 }),
    { ...envelope, type: 'action-error', message: 'That action could not complete. Try again.', sequence: 1 },
  ]);
  expect(runtime.latest().ack).toBe(1);
  Object.defineProperty(runtime.current, 'status', { get() { throw new Error('State unavailable'); } });
  runtime.changed();
  expect(runtime.messages.at(-1)).toEqual({ ...envelope, type: 'controls-unavailable' });
  expect(runtime.hosted).toEqual([true, false]);
  runtime.disconnect();
});
