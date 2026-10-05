/* Classic script for opaque-origin sandbox frames. */
(() => {
  'use strict';

  let publishControls = () => {};

  function controlState(source) {
    const controls = source.controls.map(control => {
      const result = { type: control.type, key: control.key, label: control.label, hidden: Boolean(control.hidden), disabled: Boolean(control.disabled) };

      switch (control.type) {
        case 'button':
          if (control.pressed !== undefined) result.pressed = Boolean(control.pressed);

          break;
        case 'range':
          Object.assign(result, { value: Number(control.value), min: Number(control.min), max: Number(control.max), step: Number(control.step ?? 1) });

          if (control.output !== undefined) result.output = String(control.output);
          if (control.quality !== undefined) result.quality = Number(control.quality);

          break;
        case 'select':
          Object.assign(result, { value: String(control.value), options: control.options.map(option => ({ value: String(option.value), label: String(option.label) })) });

          break;
        case 'text':
          Object.assign(result, { value: String(control.value), maxLength: control.maxLength ?? 256 });

          if (control.placeholder !== undefined) result.placeholder = String(control.placeholder);

          break;
        default:
          throw new Error('Unsupported preview control.');
      }

      return result;
    });

    return { controls, archives: source.archives.map(item => ({ key: item.key, label: item.label })), status: String(source.status), paused: Boolean(source.paused), canEscape: Boolean(source.canEscape) };
  }

  function acceptsAction(state, action) {
    if (action.kind === 'pause') return action.key === 'preview:pause';
    if (action.kind === 'escape') return action.key === 'preview:escape' && state.canEscape;
    if (action.kind === 'archive') return state.archives.some(item => item.key === action.key);

    const control = state.controls.find(item => item.key === action.key);

    if (!control || control.hidden || control.disabled || control.type !== action.kind) return false;

    switch (action.kind) {
      case 'button': return true;
      case 'select': return control.options.some(option => option.value === action.value);
      case 'text': return [...action.value].length <= control.maxLength;
      case 'range': {
        const ticks = (action.value - control.min) / control.step;

        return action.value >= control.min && action.value <= control.max && Math.abs(ticks - Math.round(ticks)) < 1e-7;
      }
      default: return false;
    }
  }

  window.ChaldeaPreview = {
    controlsChanged() { publishControls(); },
    connect(render, interactions) {
      let token = null;
      let sequence = -1;
      let lastHeight = 0;
      let lastWidth = 0;
      let externalControls = false;
      let hosted = false;
      let revision = 0;
      let actionSequence = 0;
      let sentActionSequence = -1;
      let signature = '';

      const post = message => {
        window.parent.postMessage({ channel: 'chaldea:preview', token, ...message }, '*');
      };

      const resize = () => {
        if (!token) return;

        const height = Math.ceil(document.body.getBoundingClientRect().height);
        const preferredWidth = Number(document.body.dataset.previewWidth);
        const width = Number.isFinite(preferredWidth) && preferredWidth > 0 ? Math.ceil(preferredWidth) : 0;

        if (height === lastHeight && width === lastWidth) return;

        lastHeight = height;
        lastWidth = width;
        post(width ? { type: 'resize', height, width } : { type: 'resize', height });
      };

      const publish = () => {
        if (!token || !externalControls || !interactions) return;

        try {
          const state = controlState(interactions.read());
          const nextSignature = JSON.stringify(state);

          if (nextSignature === signature && sentActionSequence === actionSequence) return;

          signature = nextSignature;
          sentActionSequence = actionSequence;
          post({ type: 'controls', state, revision: ++revision, ack: actionSequence });
        } catch {
          externalControls = false;
          hosted = false;
          interactions.hosted(false);
          post({ type: 'controls-unavailable' });
        }
      };

      publishControls = publish;

      const observer = new ResizeObserver(resize);
      observer.observe(document.body);

      const receive = event => {
        if (event.source !== window.parent || !validateHostMessage(event.data)) return;

        const data = event.data;

        if (data.type === 'init' && token === null) {
          token = data.token;
          externalControls = Boolean(data.externalControls && interactions);
          post({ type: 'ready' });
          publish();
        }

        if (data.token !== token) return;

        if (data.type === 'controls-mounted' && externalControls && !hosted && data.revision <= revision) {
          hosted = true;
          interactions.hosted(true);
          resize();
        }

        if (data.type === 'action' && hosted && data.sequence > actionSequence) {
          actionSequence = data.sequence;
          let focus;
          let failed = false;

          try {
            const state = controlState(interactions.read());

            if (acceptsAction(state, data)) {
              if (data.kind === 'pause') interactions.pause(data.value);
              else if (data.kind === 'escape') interactions.escape();
              else focus = interactions.action(data.key, data.value);
            }
          } catch {
            failed = true;
          }

          publish();

          if (focus) post({ type: 'focus', key: focus, sequence: actionSequence });
          if (failed) post({ type: 'action-error', message: 'That action could not complete. Try again.', sequence: actionSequence });

          resize();
        }

        if (data.type !== 'settings' || data.sequence <= sequence) return;

        sequence = data.sequence;

        try {
          render(Object.freeze({ ...data.settings }));
          post({ type: 'rendered', sequence });
          publish();
          resize();
        } catch {
          post({ type: 'error' });
        }
      };

      const reportError = () => {
        if (token) post({ type: 'error' });
      };

      window.addEventListener('message', receive);
      window.addEventListener('error', reportError);

      return () => {
        externalControls = false;

        if (hosted) interactions.hosted(false);
        if (publishControls === publish) publishControls = () => {};

        observer.disconnect();
        window.removeEventListener('message', receive);
        window.removeEventListener('error', reportError);
      };
    },
  };
})();
