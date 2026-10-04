import type { InteractionControl, InteractionState } from '../preview/interactions';
import { el } from './dom';

interface ControlView {
  type: InteractionControl['type'];
  root: HTMLDivElement;
  input: HTMLInputElement | HTMLSelectElement | HTMLButtonElement;
  label?: HTMLLabelElement;
  render(control: InteractionControl, waiting: boolean): void;
}

function place(container: HTMLElement, child: HTMLElement, index: number): void {
  const current = container.children.item(index);

  if (current !== child) container.insertBefore(child, current);
}

export function interactionControls(send: (key: string, value?: string | number | boolean) => number | undefined) {
  const root = el('fieldset', 'interaction-controls');
  root.disabled = true;
  root.setAttribute('aria-label', 'Preview controls');

  const fields = el('div', 'controls interaction-fields');
  const archives = el('div', 'interaction-archives');
  const pause = el('button', 'button interaction-pause', 'Pause');
  pause.type = 'button';

  let currentStatus = 'Connecting preview controls…';
  let actionError: string | undefined;
  const status = el('p', 'interaction-status', currentStatus);
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  root.append(fields, archives, pause, status);

  const views = new Map<string, ControlView>();
  const archiveButtons = new Map<string, HTMLButtonElement>();
  const pending = new Map<string, number>();
  const prefix = `interaction-${crypto.randomUUID()}`;
  let paused = false;
  let canEscape = false;

  const renderStatus = () => {
    const message = actionError ?? currentStatus;
    status.classList.toggle('interaction-error', actionError !== undefined);

    if (status.textContent !== message) status.textContent = message;
  };

  const action = (key: string, value?: string | number | boolean) => {
    const sequence = send(key, value);

    if (sequence !== undefined) {
      pending.set(key, sequence);
      actionError = undefined;
      renderStatus();
    }
  };

  pause.addEventListener('click', () => action('preview:pause', !paused));
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented || root.disabled || !canEscape) return;

    event.preventDefault();
    action('preview:escape');
  });

  function createView(control: InteractionControl): ControlView {
    const field = el('div', 'field interaction-field');

    if (control.type === 'button') {
      const input = el('button', 'button interaction-action');
      input.type = 'button';
      input.addEventListener('click', () => action(control.key));
      field.append(input);

      return {
        type: 'button', root: field, input,
        render(next) {
          if (next.type !== 'button') return;

          input.textContent = next.label;

          if (next.pressed === undefined) input.removeAttribute('aria-pressed');
          else input.setAttribute('aria-pressed', String(next.pressed));
        },
      };
    }

    const label = el('label', 'field-label');
    const row = el('div', 'field-row');
    label.htmlFor = `${prefix}-${control.key}`;
    field.append(label, row);

    if (control.type === 'select') {
      const input = el('select');
      input.id = label.htmlFor;
      input.addEventListener('change', () => action(control.key, input.value));
      row.append(input);

      const options = new Map<string, HTMLOptionElement>();

      return {
        type: 'select', root: field, input, label,
        render(next, waiting) {
          if (next.type !== 'select') return;

          const value = waiting ? input.value : next.value;
          const retained = new Set(next.options.map(option => option.value));

          for (const [key, option] of options) {
            if (retained.has(key)) continue;

            option.remove();
            options.delete(key);
          }

          next.options.forEach((choice, index) => {
            let option = options.get(choice.value);

            if (!option) {
              option = el('option');
              option.value = choice.value;
              options.set(choice.value, option);
            }

            if (option.textContent !== choice.label) option.textContent = choice.label;

            place(input, option, index);
          });

          if (input.value !== value) input.value = value;
        },
      };
    }

    const input = el('input');
    input.id = label.htmlFor;
    input.type = control.type === 'range' ? 'range' : 'text';
    row.append(input);

    if (control.type === 'range') {
      const output = el('output', 'interaction-value');
      output.htmlFor.add(input.id);
      row.append(output);

      const quality = el('meter', 'interaction-quality');
      quality.min = 0;
      quality.max = 100;
      quality.hidden = true;
      field.append(quality);
      input.addEventListener('input', () => {
        output.value = input.value;
        action(control.key, input.valueAsNumber);
      });

      return {
        type: 'range', root: field, input, label,
        render(next, waiting) {
          if (next.type !== 'range') return;

          if (!waiting) {
            input.min = String(next.min);
            input.max = String(next.max);
            input.step = String(next.step);

            if (input.valueAsNumber !== next.value) input.value = String(next.value);

            output.value = next.output ?? String(next.value);
          }

          quality.hidden = next.quality === undefined;

          if (next.quality !== undefined) {
            quality.value = next.quality;
            quality.setAttribute('aria-label', `${next.label} quality`);
          }
        },
      };
    }

    input.addEventListener('input', () => action(control.key, input.value));

    return {
      type: 'text', root: field, input, label,
      render(next, waiting) {
        if (next.type !== 'text') return;

        input.maxLength = next.maxLength;
        input.placeholder = next.placeholder ?? '';

        if (!waiting && input.value !== next.value) input.value = next.value;
      },
    };
  }

  return {
    root,
    update(state: InteractionState, ack: number) {
      const active = document.activeElement;
      const focused = active instanceof HTMLElement && root.contains(active) ? active : undefined;
      const text = focused instanceof HTMLInputElement && focused.type === 'text' ? focused : undefined;
      const selection = text ? { start: text.selectionStart, end: text.selectionEnd, direction: text.selectionDirection } : undefined;
      const retained = new Set(state.controls.map(control => control.key));

      root.disabled = false;

      for (const [key, view] of views) {
        if (retained.has(key)) continue;

        view.root.remove();
        views.delete(key);
        pending.delete(key);
      }

      state.controls.forEach((control, index) => {
        let view = views.get(control.key);

        if (!view || view.type !== control.type) {
          view?.root.remove();
          view = createView(control);
          views.set(control.key, view);
          pending.delete(control.key);
        }

        const waiting = (pending.get(control.key) ?? 0) > ack;

        if (!waiting) pending.delete(control.key);

        view.root.hidden = control.hidden;
        view.input.disabled = control.disabled;
        view.input.setAttribute('aria-label', control.label);

        if (view.label) view.label.textContent = control.label;

        view.render(control, waiting);
        place(fields, view.root, index);
      });

      const retainedArchives = new Set(state.archives.map(archive => archive.key));

      for (const [key, button] of archiveButtons) {
        if (retainedArchives.has(key)) continue;

        button.remove();
        archiveButtons.delete(key);
      }

      state.archives.forEach((archive, index) => {
        let button = archiveButtons.get(archive.key);

        if (!button) {
          button = el('button', 'button interaction-archive');
          button.type = 'button';
          button.addEventListener('click', () => action(archive.key));
          archiveButtons.set(archive.key, button);
        }

        if (button.textContent !== archive.label) button.textContent = archive.label;

        place(archives, button, index);
      });

      archives.hidden = state.archives.length === 0;
      paused = state.paused;
      canEscape = state.canEscape ?? false;
      pause.textContent = paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-pressed', String(paused));
      currentStatus = state.status;
      renderStatus();

      for (const [key, sequence] of pending) if (sequence <= ack) pending.delete(key);

      if (focused?.isConnected && !focused.matches(':disabled') && !focused.closest('[hidden]')) {
        if (document.activeElement !== focused) focused.focus({ preventScroll: true });

        if (text && selection?.start !== null && selection?.start !== undefined && selection.end !== null) {
          const start = Math.min(selection.start, text.value.length);
          const end = Math.min(selection.end, text.value.length);
          const direction = selection.direction ?? 'none';

          if (text.selectionStart !== start || text.selectionEnd !== end || text.selectionDirection !== direction) {
            text.setSelectionRange(start, end, direction);
          }
        }
      }
    },
    focus(key: string) {
      if (root.disabled) return;

      const input = key === 'preview:pause' ? pause : views.get(key)?.input ?? archiveButtons.get(key);

      if (input && !input.disabled && !input.closest('[hidden]')) input.focus();
    },
    unavailable(message = 'Preview controls are unavailable.') {
      root.disabled = true;
      pending.clear();
      actionError = undefined;
      currentStatus = message;
      renderStatus();
    },
    error(message: string) {
      actionError = message;
      renderStatus();
    },
  };
}
