
(() => {
  const root = document.getElementById('tsugumori-clipboard-studies');
  const clip = root.querySelector('.clipboard');
  const designs = [...root.querySelectorAll('[data-design]')];
  const search = root.querySelector('input');
  const pinned = root.querySelector('.cb-pinned');
  const list = root.querySelector('.cb-list');
  const preview = root.querySelector('.cb-preview');
  const type = root.querySelector('.cb-type');
  const count = root.querySelector('.cb-count');
  const visibleCount = root.querySelector('.cb-visible-count');
  const use = root.querySelector('.cb-use');
  const useLabel = root.querySelector('.cb-use-label');
  const clear = root.querySelector('.cb-clear');
  const confirm = root.querySelector('.cb-confirm');
  const cancel = root.querySelector('.cb-cancel');
  const reopen = root.querySelector('.reopen-zone');
  const state = { variant: 'a', hover: false, grid: .16 };
  const labels = { current: 'Current outline controls', a: 'A, black header and footer bands', b: 'B, raised keys', c: 'C, red plates', d: 'D, dark control docks' };
  const samples = [
    { id: '01', title: 'Terminal refinement', body: 'Keep the red accents and the glyph field.\nRefine the control spacing.', pinned: true, age: 'JUST NOW' },
    { id: '02', title: 'Tsugumori repository', body: 'https://github.com/Aleph1-9012/Tsugumori', pinned: false, age: '2 MIN AGO' },
    { id: '03', title: 'Everyday shortcuts', body: 'Super + N opens Quick Notes.\nSuper + J opens clipboard history.', pinned: false, age: '5 MIN AGO' }
  ];
  let entries = samples.slice();
  let selected = '03';
  let pinnedOnly = false;
  let feedbackTimer;

  function resetFeedback() { clearTimeout(feedbackTimer); useLabel.textContent = 'USE ENTRY'; }
  function renderEntries() {
    resetFeedback();
    const query = search.value.trim().toLowerCase();
    const shown = entries.filter(entry => (!pinnedOnly || entry.pinned) && (entry.title + ' ' + entry.body).toLowerCase().includes(query));
    if (!shown.some(entry => entry.id === selected)) selected = shown.length ? shown[0].id : '';
    list.replaceChildren();
    for (const entry of shown) {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'cb-entry'; row.dataset.entry = entry.id;
      row.setAttribute('aria-pressed', String(entry.id === selected));
      for (const [className, text] of [['cb-entry-number', entry.id], ['cb-entry-title', entry.title], ['cb-entry-meta', (entry.pinned ? 'PINNED' : entry.age) + ' · TEXT']]) {
        const span = document.createElement('span'); span.className = className; span.textContent = text; row.appendChild(span);
      }
      row.addEventListener('click', () => { selected = entry.id; renderEntries(); });
      list.appendChild(row);
    }
    if (!shown.length) { const empty = document.createElement('div'); empty.className = 'cb-empty'; empty.textContent = 'No matching entries'; list.appendChild(empty); }
    const entry = shown.find(item => item.id === selected);
    preview.textContent = entry ? entry.body : 'Select an entry to preview';
    type.textContent = entry ? entry.id + ' / TEXT' : '— / TEXT';
    visibleCount.textContent = String(shown.length).padStart(2, '0');
    count.textContent = String(entries.length).padStart(2, '0') + ' ENTRIES // LOCAL';
    pinned.setAttribute('aria-pressed', String(pinnedOnly));
    use.disabled = !entry;
    clear.disabled = !entries.some(item => !item.pinned);
  }
  function renderDesign() {
    clip.dataset.variant = state.variant;
    clip.setAttribute('aria-label', 'Clipboard design ' + labels[state.variant] + '. Sample entries only.');
    clip.classList.toggle('force-hover', state.hover);
    clip.style.setProperty('--cb-grid', 'rgba(212,22,28,' + state.grid + ')');
    for (const button of designs) {
      const active = button.dataset.design === state.variant;
      button.setAttribute('aria-pressed', String(active)); button.classList.toggle('btn-primary', active);
    }
  }
  for (const button of designs) button.addEventListener('click', () => {
    state.variant = button.dataset.design;
    entries = samples.slice(); selected = '03'; pinnedOnly = false; search.value = '';
    confirm.hidden = true; clip.hidden = false; reopen.hidden = true;
    renderDesign(); renderEntries();
  });
  search.addEventListener('input', renderEntries);
  pinned.addEventListener('click', () => { pinnedOnly = !pinnedOnly; renderEntries(); });
  use.addEventListener('click', () => { resetFeedback(); useLabel.textContent = 'PREVIEWED'; feedbackTimer = setTimeout(resetFeedback, 1400); });
  clear.addEventListener('click', () => { confirm.hidden = false; cancel.focus(); });
  cancel.addEventListener('click', () => { confirm.hidden = true; clear.focus(); });
  root.querySelector('.cb-confirm-clear').addEventListener('click', () => { entries = entries.filter(entry => entry.pinned); confirm.hidden = true; renderEntries(); search.focus(); });
  root.querySelector('.cb-close').addEventListener('click', () => { clip.hidden = true; reopen.hidden = false; root.querySelector('.cb-reopen').focus(); });
  root.querySelector('.cb-reopen').addEventListener('click', () => { clip.hidden = false; reopen.hidden = true; confirm.hidden = true; search.focus(); });
  renderDesign(); renderEntries();
  if (globalThis.Tweak) {
    const tweak = new Tweak({ container: clip, onChange: renderDesign });
    tweak.addToggle(state, 'hover', { label: 'Show button hover states' });
    tweak.addSlider(state, 'grid', { label: 'Grid strength', min: .04, max: .24, step: .02 });
  }
})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"b\"]"}], "remove": ["button[data-design]"], "controls": false});
