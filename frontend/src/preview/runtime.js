/* Classic script for opaque-origin sandbox frames. */
(() => {
  'use strict';
  window.ChaldeaPreview = {
    connect(render) {
      let token = null;
      let sequence = -1;
      let lastHeight = 0;
      const resize = () => {
        if (!token) return;
        const height = Math.ceil(document.body.getBoundingClientRect().height);
        if (height === lastHeight) return;
        lastHeight = height;
        window.parent.postMessage({ channel: 'chaldea:preview', type: 'resize', token, height }, '*');
      };
      const observer = new ResizeObserver(resize);
      observer.observe(document.body);
      const receive = (event) => {
        const data = event.data;
        if (event.source !== window.parent || !data || data.channel !== 'chaldea:preview' ||
            typeof data.token !== 'string' || !/^[a-f0-9-]{36}$/.test(data.token)) return;
        if (data.type === 'init' && token === null) {
          token = data.token;
          window.parent.postMessage({ channel: 'chaldea:preview', type: 'ready', token }, '*');
        }
        if (data.type !== 'settings' || data.token !== token || !Number.isSafeInteger(data.sequence) ||
            data.sequence <= sequence || !data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) return;
        sequence = data.sequence;
        try {
          render(Object.freeze({ ...data.settings }));
          window.parent.postMessage({ channel: 'chaldea:preview', type: 'rendered', token, sequence }, '*');
          resize();
        } catch { window.parent.postMessage({ channel: 'chaldea:preview', type: 'error', token }, '*'); }
      };
      window.addEventListener('message', receive);
      window.addEventListener('error', () => {
        if (token) window.parent.postMessage({ channel: 'chaldea:preview', type: 'error', token }, '*');
      });
      return () => { observer.disconnect(); window.removeEventListener('message', receive); };
    },
  };
})();
