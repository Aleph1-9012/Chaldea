// SPDX-License-Identifier: 0BSD
(() => {
  const slider = document.querySelector('.slider');
  const input = document.querySelector('input[type="range"]');
  const output = document.querySelector('[data-value]');
  const label = document.querySelector('label');
  const drawing = document.querySelector('.drawing');
  const svg = document.querySelector('.track-art');
  const clip = document.querySelector('[data-clip]');
  const bounds = document.querySelector('[data-bounds]');
  const marks = document.querySelector('[data-marks]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let initialValue;
  let widgetWidth = 344;
  let response = 1;
  let contact = 0;
  let target = 0;
  let pressed = false;
  let frame = 0;
  let lastTime = 0;

  function render() {
    const width = drawing.clientWidth;
    const value = input.valueAsNumber;
    output.textContent = `${value}%`;
    input.setAttribute('aria-valuetext', `${value} percent`);

    if (!width) return;

    const position = width * value / 100;
    svg.setAttribute('viewBox', `0 0 ${width} 48`);
    clip.setAttribute('width', String(position));
    bounds.setAttribute('width', String(width));
    const paths = window.ContactTrack.geometry(width, position, contact * response);

    while (marks.children.length > paths.length) marks.lastElementChild.remove();

    paths.forEach((entry, index) => {
      let path = marks.children[index];

      if (!path) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        marks.append(path);
      }

      path.setAttribute('d', entry.d);
      path.dataset.color = entry.role;
      path.setAttribute('fill', entry.fill ? 'currentColor' : 'none');
      path.setAttribute('stroke', entry.fill ? 'none' : 'currentColor');
      path.setAttribute('stroke-width', String(entry.lineWidth));
      path.setAttribute('opacity', String(entry.opacity));

      if (entry.clip === 'active') path.setAttribute('clip-path', 'url(#active-track)');
      else if (entry.clip === 'track') path.setAttribute('clip-path', 'url(#track-bounds)');
      else path.removeAttribute('clip-path');
    });
  }

  function fitPreview() {
    const available = Math.max(1, document.body.clientWidth - 48);
    const scale = Math.min(2.5, Math.max(1, available / 344));
    slider.style.setProperty('--preview-scale', String(scale));
    slider.style.setProperty('--preview-width', `${Math.min(widgetWidth, available / scale)}px`);
    render();
  }

  function animate(time) {
    const elapsed = lastTime ? Math.min(time - lastTime, 32) : 16;
    lastTime = time;
    contact += (target - contact) * (1 - Math.exp(-elapsed / 52));

    if (Math.abs(target - contact) < .002) contact = target;

    render();
    frame = contact === target ? 0 : requestAnimationFrame(animate);

    if (!frame) lastTime = 0;
  }

  function respond() {
    target = pressed || input.matches(':focus-visible') ? 1 : 0;

    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      contact = target;
      render();
    } else if (!frame) {
      frame = requestAnimationFrame(animate);
    }
  }

  function release() {
    pressed = false;
    respond();
  }

  input.addEventListener('input', () => { respond(); render(); });
  input.addEventListener('pointerdown', () => { pressed = true; respond(); });
  input.addEventListener('focus', respond);
  input.addEventListener('blur', release);
  input.addEventListener('pointercancel', release);
  window.addEventListener('pointerup', release);
  window.addEventListener('blur', release);
  window.addEventListener('resize', fitPreview);
  reducedMotion.addEventListener('change', respond);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;

    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    pressed = false;
    contact = 0;
    target = 0;
    render();
  });

  new ResizeObserver(render).observe(drawing);
  fitPreview();

  window.ChaldeaPreview.connect(settings => {
    label.textContent = settings.label;
    slider.style.setProperty('--slider-bg', settings.backgroundColor);
    slider.style.setProperty('--slider-text', settings.textColor);
    slider.style.setProperty('--slider-accent', settings.accentColor);
    widgetWidth = settings.widgetWidth;
    response = settings.response;

    if (initialValue !== settings.initialValue) {
      initialValue = settings.initialValue;
      input.value = String(initialValue);
    }

    fitPreview();
  });
})();
