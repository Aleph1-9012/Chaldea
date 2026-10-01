// SPDX-License-Identifier: 0BSD
(() => {
  const root = document.getElementById('ts-curtain-a-refinements');
  if (!root) return;
  const state = { details:true, detailOpacity:0.8, panel:'menu', covered:1 };
  const studies = Array.from(root.querySelectorAll('.ts-study')).map(node => ({
    node, assembly:node.querySelector('.ts-assembly'), content:node.querySelector('.ts-content'),
    curtain:node.querySelector('.ts-curtain')
  }));
  const slider = root.querySelector('#ts-curtain-a-frame');
  const status = root.querySelector('.ts-state');
  const replay = root.querySelector('.ts-replay');
  const speed = root.querySelector('#ts-curtain-a-speed');
  let raf = 0, playing = false;
  const clamp = n => Math.min(1,Math.max(0,n));
  const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2,-10 * clamp(t));
  function closeEase(t) {
    t = clamp(t);
    let low = 0, high = 1, u = t;
    for (let i = 0; i < 18; i++) {
      u = (low + high) / 2;
      const x = 3 * (1-u) * (1-u) * u * 0.76 + 3 * (1-u) * u * u * 0.24 + u*u*u;
      if (x < t) low = u; else high = u;
    }
    return 3 * (1-u) * u * u + u*u*u;
  }
  function paint(covered, offset = 0, hidden = false) {
    state.covered = clamp(covered);
    const cover = state.covered;
    studies.forEach(study => {
      study.assembly.style.transform = `translateX(${offset}%)`;
      study.assembly.style.visibility = hidden ? 'hidden' : 'visible';
      study.curtain.style.width = `${cover*100}%`;
      study.curtain.style.visibility = cover > 0 ? 'visible' : 'hidden';
    });
    slider.value = String(Math.round((1-cover)*100));
    slider.setAttribute('aria-valuetext',`${slider.value} percent revealed`);
  }
  function loadPanel() {
    const template = root.querySelector(`#ts-curtain-a-${state.panel}-sample`);
    studies.forEach(study => study.content.replaceChildren(template.content.cloneNode(true)));
    root.querySelectorAll('[data-panel]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.panel === state.panel)));
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0; playing = false; replay.textContent = 'Replay';
  }
  function playSequence() {
    if (playing) {
      stop();
      paint(state.covered);
      status.textContent = `${slider.value}% REVEALED`;
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(1); status.textContent = 'STILL PREVIEW'; return;
    }
    playing = true;
    replay.textContent = 'Pause';
    const multiplier = Number(speed.value);
    const start = performance.now();
    let phase = '';
    function setPhase(value) { if (value !== phase) { phase = value; status.textContent = value; } }
    function tick(now) {
      if (!root.isConnected) { stop(); return; }
      const t = (now-start)/multiplier;
      if (t < 440) { setPhase('OPENING'); paint(1,102*(1-outExpo(t/440))); }
      else if (t < 780) { paint(1-outExpo((t-440)/340)); }
      else if (t < 1480) { setPhase('OPEN'); paint(0); }
      else if (t < 2260) {
        setPhase('CLOSING');
        const c = t-1480;
        paint(closeEase(c/420),102*closeEase((c-270)/510));
      } else if (t < 2560) { setPhase('CLOSED'); paint(1,102,true); }
      else { stop(); paint(1); status.textContent = 'FULL CURTAIN'; return; }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }
  root.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click',() => {
    stop(); state.panel = button.dataset.panel; loadPanel(); paint(0.55); status.textContent = '45% REVEALED';
  }));
  slider.addEventListener('input',() => {
    stop(); paint(1-Number(slider.value)/100); status.textContent = `${slider.value}% REVEALED`;
  });
  replay.addEventListener('click',playSequence);
  speed.addEventListener('change',() => { stop(); paint(state.covered); status.textContent = `${slider.value}% REVEALED`; });
  function renderDesign() {
    root.style.setProperty('--ts-detail-opacity',String(state.detailOpacity));
    root.dataset.details = String(state.details);
  }
  loadPanel(); renderDesign(); paint(state.covered);
  window.XLR8Preview.connect(settings => { Object.assign(state, settings); renderDesign(); });
})();
