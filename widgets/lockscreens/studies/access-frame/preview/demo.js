
(() => {
  const root = document.getElementById('ts-lock-studies');
  const screen = root.querySelector('.ts-screen');
  const selectors = Array.from(root.querySelectorAll('[data-design]'));
  const pass = root.querySelector('.ts-password');
  const feedback = root.querySelector('.ts-feedback');
  const unlock = root.querySelector('.ts-unlock');
  const shade = root.querySelector('.ts-dialog-shade');
  const powerTitle = root.querySelector('#ts-power-title');
  const back = root.querySelector('.ts-dialog-back');
  const glyphs = root.querySelector('.ts-glyphs');
  const state = { auth:'entered', grid:16, motion:true };
  const messages = { empty:'ENTER YOUR PASSWORD', entered:'READY TO UNLOCK', failed:'INCORRECT PASSWORD · TRY AGAIN' };
  let previewTimer = null;
  let activePower = null;
  const symbols = ['│','┌','·','╱','┤','└',' ','─','┬','╲','┐','│',' ','┴'];
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 16; col++) {
      const cell = document.createElement('span');
      const traceColumn = 11 + Math.floor(row / 3) % 3;
      const trace = col === traceColumn || (row % 3 === 0 && col === traceColumn + 1);
      cell.textContent = trace ? (row % 3 === 0 ? (col === traceColumn ? '┌' : '─') : '│') : symbols[(row * 19 + col * 7 + col * row) % symbols.length];
      if (trace) cell.className = 'ts-trace';
      fragment.appendChild(cell);
    }
  }
  glyphs.appendChild(fragment);

  function endPreview() {
    if (previewTimer !== null) clearTimeout(previewTimer);
    previewTimer = null;
    screen.classList.remove('ts-previewing');
    unlock.disabled = false;
  }
  function render() {
    endPreview();
    screen.dataset.auth = state.auth;
    screen.dataset.motion = state.motion ? 'on' : 'off';
    screen.style.setProperty('--ts-grid-alpha', String(state.grid / 100));
    pass.value = state.auth === 'empty' ? '' : '••••••••';
    pass.placeholder = state.auth === 'empty' ? 'Password…' : '';
    feedback.textContent = messages[state.auth] || messages.entered;
  }
  selectors.forEach(button => {
    button.addEventListener('click', () => {
      endPreview();
      screen.dataset.layout = button.dataset.design;
      selectors.forEach(option => {
        const selected = option === button;
        option.setAttribute('aria-pressed', String(selected));
        option.classList.toggle('btn-primary', selected);
      });
      feedback.textContent = messages[state.auth] || messages.entered;
    });
  });
  unlock.addEventListener('click', () => {
    if (state.auth === 'empty') {
      feedback.textContent = 'DEMO ONLY · CHOOSE FILLED STATE';
      return;
    }
    if (state.auth === 'failed') {
      feedback.textContent = messages.failed;
      return;
    }
    endPreview();
    unlock.disabled = true;
    screen.classList.add('ts-previewing');
    feedback.textContent = 'UNLOCK PREVIEW';
    previewTimer = setTimeout(() => {
      endPreview();
      feedback.textContent = messages[state.auth] || messages.entered;
    }, state.motion ? 1500 : 800);
  });
  function closePower() {
    shade.hidden = true;
    const focusTarget = activePower;
    activePower = null;
    root.querySelector('.ts-chrome').inert = false;
    root.querySelector('.ts-main').inert = false;
    root.querySelector('.ts-footer').inert = false;
    if (focusTarget) focusTarget.focus();
  }
  root.querySelectorAll('[data-power]').forEach(button => {
    button.addEventListener('click', () => {
      endPreview();
      activePower = button;
      powerTitle.textContent = button.dataset.power === 'restart' ? 'Restart?' : 'Shut down?';
      shade.hidden = false;
      root.querySelector('.ts-chrome').inert = true;
      root.querySelector('.ts-main').inert = true;
      root.querySelector('.ts-footer').inert = true;
      back.focus();
    });
  });
  back.addEventListener('click', closePower);
  shade.addEventListener('click', event => { if (event.target === shade) closePower(); });
  shade.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closePower(); }
    if (event.key === 'Tab') { event.preventDefault(); back.focus(); }
  });
  render();
  if (globalThis.Tweak) {
    const tweak = new Tweak({ container:screen, onChange:render });
    tweak.addSelect(state, 'auth', { label:'Password state', options:[{label:'Filled',value:'entered'},{label:'Empty',value:'empty'},{label:'Incorrect password',value:'failed'}] });
    tweak.addSlider(state, 'grid', { label:'Background grid', min:0, max:35, step:1, unit:'%' });
    tweak.addToggle(state, 'motion', { label:'Unlock animation' });
  }
})();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"a\"]"}], "remove": ["button[data-design]"], "controls": false});
