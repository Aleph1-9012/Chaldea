/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root = document.getElementById('ts-notes-d');
  const stack = root.querySelector('.ts-stack');
  const status = root.querySelector('.ts-status');
  const notes = [
    { id: 1, title: 'Before I leave', body: 'Pick up groceries\nCharge the headphones\nBack up the dotfiles', changed: false },
    { id: 2, title: 'Useful commands', body: 'hyprctl monitors\nwpctl status', changed: false }
  ];
  let activeId = 1;
  let nextId = 3;
  const design = { grid: true };
  function selectNote(note) {
    activeId = note.id;
    renderNotes();
    status.textContent = 'PREVIEW · NOT SAVED TO DISK';
  }
  function renderNotes() {
    stack.replaceChildren();
    notes.forEach((note) => {
      const expanded = note.id === activeId;
      const panel = document.createElement('article');
      panel.className = 'ts-memo';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'ts-memo-top';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-controls', 'ts-notes-d-note-' + note.id);
      toggle.setAttribute('aria-label', (expanded ? 'Collapse ' : 'Open ') + (note.title || 'Untitled note'));
      const badge = document.createElement('span');
      badge.className = 'ts-number';
      badge.textContent = String(note.id).padStart(2, '0');
      const kind = document.createElement('span');
      kind.className = 'ts-note-kind';
      kind.textContent = 'PERSONAL NOTE';
      const indicator = document.createElement('span');
      indicator.className = 'ts-expand';
      indicator.setAttribute('aria-hidden', 'true');
      indicator.textContent = expanded ? '−' : '+';
      toggle.append(badge, kind, indicator);
      toggle.addEventListener('click', () => { activeId = expanded ? null : note.id; renderNotes(); });
      panel.append(toggle);
      const content = document.createElement('div');
      content.id = 'ts-notes-d-note-' + note.id;
      if (expanded) {
        content.className = 'ts-editor';
        const title = document.createElement('input');
        title.type = 'text';
        title.className = 'ts-title';
        title.value = note.title;
        title.placeholder = 'Untitled note';
        title.setAttribute('aria-label', 'Note title');
        const body = document.createElement('textarea');
        body.className = 'ts-body';
        body.rows = 4;
        body.value = note.body;
        body.placeholder = 'Write a quick note…';
        body.setAttribute('aria-label', 'Note text');
        const footer = document.createElement('div');
        footer.className = 'ts-note-footer';
        const state = document.createElement('span');
        state.textContent = note.changed ? 'EDITED IN PREVIEW' : 'EDIT NOTE';
        const lines = document.createElement('span');
        const countLines = () => { const n = note.body ? note.body.split('\n').length : 0; lines.textContent = n + (n === 1 ? ' LINE' : ' LINES'); };
        countLines();
        footer.append(state, lines);
        title.addEventListener('input', () => {
          note.title = title.value;
          note.changed = true;
          state.textContent = 'EDITED IN PREVIEW';
          toggle.setAttribute('aria-label', 'Collapse ' + (note.title || 'Untitled note'));
        });
        body.addEventListener('input', () => {
          note.body = body.value;
          note.changed = true;
          state.textContent = 'EDITED IN PREVIEW';
          countLines();
        });
        const counter=document.createElement('span');counter.dataset.textCount='';counter.hidden=true;
        content.append(counter, title, body, footer);
      } else {
        const summary = document.createElement('button');
        summary.type = 'button';
        summary.className = 'ts-summary';
        summary.setAttribute('aria-label', 'Open ' + (note.title || 'Untitled note'));
        const title = document.createElement('span');
        title.className = 'ts-summary-title';
        title.textContent = note.title || 'Untitled note';
        const excerpt = document.createElement('span');
        excerpt.className = 'ts-summary-body';
        excerpt.textContent = note.body.split('\n')[0].slice(0, 66) || 'Empty note';
        summary.append(title, excerpt);
        summary.addEventListener('click', () => selectNote(note));
        content.append(summary);
      }
      panel.append(content);
      stack.append(panel);
    });
    XLR8Notes.updateCount();XLR8Notes.reveal(stack,'.ts-memo:has([aria-expanded="true"])');
  }
  root.querySelector('.ts-new').addEventListener('click', () => {
    const note = { id: nextId++, title: '', body: '', changed: false };
    XLR8Notes.add(notes,note);
    selectNote(note);
    stack.querySelector('input').focus();
    status.textContent = 'NEW NOTE · PREVIEW ONLY';
  });
  function renderDesign() { root.classList.toggle('ts-no-grid', !design.grid); }
  renderNotes();
  renderDesign();
  window.XLR8Preview.connect(settings => {
    design.grid=settings.s0Grid;renderDesign();
    XLR8Notes.apply(settings,110,10);
    XLR8Notes.reveal(stack,'.ts-memo:has([aria-expanded="true"])');
  });
})();
