import Ajv from 'ajv';
import type { LoadedWidget, Settings } from '../catalog/contracts';

type PreviewMessage = { channel: 'chaldea:preview'; token: string } & (
  | { type: 'ready' | 'error' }
  | { type: 'resize'; height: number }
  | { type: 'rendered'; sequence: number }
);

const checkMessage = new Ajv().compile<PreviewMessage>({
  type: 'object',
  properties: { channel: { const: 'chaldea:preview' }, token: { type: 'string' } },
  required: ['channel', 'token'],
  oneOf: [
    { properties: { type: { enum: ['ready', 'error'] } }, required: ['type'] },
    { properties: { type: { const: 'resize' }, height: { type: 'number' } }, required: ['type', 'height'] },
    { properties: { type: { const: 'rendered' }, sequence: { type: 'integer' } }, required: ['type', 'sequence'] },
  ],
});

export interface Preview { update(settings: Settings): void; destroy(): void }

export function mountPreview(host: HTMLElement, widget: LoadedWidget, initial: Settings): Preview {
  const frame = document.createElement('iframe');
  frame.title = `${widget.bundle.definition.title} browser preview`;
  // Artwork controls may save files, while the frame keeps its opaque origin.
  frame.setAttribute('sandbox', 'allow-scripts allow-downloads');
  frame.referrerPolicy = 'no-referrer';
  frame.src = new URL(widget.bundle.definition.preview, widget.base).href;
  const token = crypto.randomUUID();
  let ready = false, disposed = false, sequence = 0;
  let settings = initial;
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
  };

  window.addEventListener('message', receive);
  frame.addEventListener('load', () => {
    if (!disposed) frame.contentWindow?.postMessage({ channel: 'chaldea:preview', type: 'init', token }, '*');
  });
  frame.addEventListener('error', fail);
  host.dataset.ready = 'false'; host.replaceChildren(frame);
  timeout = setTimeout(fail, 6000);

  return {
    update(next) { settings = next; send(); },
    destroy() { disposed = true; clearTimeout(timeout); window.removeEventListener('message', receive); frame.remove(); },
  };
}
