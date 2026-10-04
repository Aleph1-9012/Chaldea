import Ajv from 'ajv';
import type { LoadedWidget, Settings } from '../catalog/contracts';
import controlsSchema from '../../../schemas/preview-controls.schema.json';
import { checkAction, interactionKind, validInteractionState } from './interactions';
import type { InteractionState, InteractionValue, InteractionView } from './interactions';

type PreviewMessage = { channel: 'chaldea:preview'; token: string } & (
  | { type: 'ready' | 'error' }
  | { type: 'resize'; height: number }
  | { type: 'rendered'; sequence: number }
  | { type: 'controls'; state: InteractionState; revision: number; ack: number }
  | { type: 'focus'; key: string; sequence: number }
  | { type: 'action-error'; message: string; sequence: number }
  | { type: 'controls-unavailable' }
);

const checkMessage = new Ajv().addSchema(controlsSchema).compile<PreviewMessage>({
  type: 'object',
  properties: { channel: { const: 'chaldea:preview' }, token: { type: 'string' } },
  required: ['channel', 'token'],
  oneOf: [
    { properties: { type: { enum: ['ready', 'error', 'controls-unavailable'] } }, required: ['type'] },
    { properties: { type: { const: 'resize' }, height: { type: 'number' } }, required: ['type', 'height'] },
    { properties: { type: { const: 'rendered' }, sequence: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER } }, required: ['type', 'sequence'] },
    { properties: { type: { const: 'controls' }, state: { $ref: 'chaldea-preview-controls-v1' }, revision: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER }, ack: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER } }, required: ['type', 'state', 'revision', 'ack'] },
    { properties: { type: { const: 'focus' }, key: { type: 'string', pattern: '^[A-Za-z0-9:_-]{1,80}$' }, sequence: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER } }, required: ['type', 'key', 'sequence'] },
    { properties: { type: { const: 'action-error' }, message: { type: 'string', maxLength: 256 }, sequence: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER } }, required: ['type', 'message', 'sequence'] },
  ],
});

export interface Preview {
  update(settings: Settings): void;
  action(key: string, value?: InteractionValue): number | undefined;
  destroy(): void;
}

export function mountPreview(host: HTMLElement, widget: LoadedWidget, initial: Settings, interactions?: InteractionView): Preview {
  const frame = document.createElement('iframe');
  frame.title = `${widget.bundle.definition.title} browser preview`;
  // Artwork controls may save files, while the frame keeps its opaque origin.
  frame.setAttribute('sandbox', 'allow-scripts allow-downloads');
  if (interactions) frame.allow = 'autoplay';

  frame.referrerPolicy = 'no-referrer';
  frame.src = new URL(widget.bundle.definition.preview, widget.base).href;
  const token = crypto.randomUUID();
  let ready = false, disposed = false, sequence = 0;
  let settings = initial;
  let interactionState: InteractionState | undefined;
  let interactionRevision = 0, actionSequence = 0, actionAck = 0;
  let timeout: ReturnType<typeof setTimeout>;
  const fail = () => {
    if (disposed) return;

    frame.remove(); clearTimeout(timeout);
    const fallback = document.createElement('img');
    fallback.src = new URL(widget.bundle.definition.thumbnail, widget.base).href;
    fallback.alt = widget.bundle.definition.title;
    const message = document.createElement('p'); message.className = 'preview-error';
    message.textContent = widget.bundle.definition.exports.some(f => f.kind === 'template')
      ? 'Preview unavailable. Valid QML can still be customized and exported.'
      : 'Preview unavailable. Reload the widget to try again.';
    host.style.removeProperty('min-height');
    host.replaceChildren(fallback, message);
    interactions?.unavailable('Preview unavailable. Reload to restore its controls.');
    disposed = true; window.removeEventListener('message', receive);
  };

  const send = () => {
    if (!ready || disposed) return;

    clearTimeout(timeout); timeout = setTimeout(fail, 6000);
    frame.contentWindow?.postMessage({ channel: 'chaldea:preview', type: 'settings', token, sequence: ++sequence, settings }, '*');
  };

  const receive = (event: MessageEvent<unknown>) => {
    // Opaque origins report "null". Authenticate the exact Window and instance token.
    if (event.source !== frame.contentWindow || disposed || !checkMessage(event.data)) return;

    const data = event.data;

    if (data.token !== token) return;

    if (data.type === 'resize') {
      host.style.minHeight = `${Math.max(300, Math.min(4096, data.height))}px`;
    }

    if (data.type === 'ready' && !ready) { ready = true; send(); }
    if (data.type === 'rendered' && data.sequence === sequence) { clearTimeout(timeout); host.dataset.ready = 'true'; }
    if (data.type === 'error') fail();
    if (data.type === 'controls' && interactions && data.revision > interactionRevision && data.ack >= actionAck && data.ack <= actionSequence && validInteractionState(data.state)) {
      interactionRevision = data.revision;
      actionAck = data.ack;
      interactionState = data.state;
      interactions.update(data.state, data.ack);
      frame.contentWindow?.postMessage({ channel: 'chaldea:preview', type: 'controls-mounted', token, revision: data.revision }, '*');
    }

    if (data.type === 'focus' && interactionState && data.sequence === actionSequence) interactions?.focus(data.key);
    if (data.type === 'action-error' && interactionState && data.sequence === actionSequence) interactions?.error(data.message);
    if (data.type === 'controls-unavailable') {
      interactionState = undefined;
      interactions?.unavailable('Use the controls inside the preview.');
    }
  };

  window.addEventListener('message', receive);
  frame.addEventListener('load', () => {
    if (!disposed) frame.contentWindow?.postMessage({ channel: 'chaldea:preview', type: 'init', token, externalControls: Boolean(interactions) }, '*');
  });
  frame.addEventListener('error', fail);
  host.dataset.ready = 'false'; host.replaceChildren(frame);
  timeout = setTimeout(fail, 6000);

  return {
    update(next) { settings = next; send(); },
    action(key, value) {
      if (disposed || !ready || !interactionState) return;

      const kind = interactionKind(interactionState, key);

      if (!kind) return;

      const message = { channel: 'chaldea:preview', type: 'action', token, key, kind, value, sequence: actionSequence + 1 };

      if (!checkAction(message)) return;

      actionSequence = message.sequence;
      frame.contentWindow?.postMessage(message, '*');

      return actionSequence;
    },
    destroy() { disposed = true; clearTimeout(timeout); window.removeEventListener('message', receive); frame.remove(); },
  };
}
