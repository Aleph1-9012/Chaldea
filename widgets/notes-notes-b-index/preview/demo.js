/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root = document.getElementById('ts-notes-b');
  if (!root) return;
  const list = root.querySelector('.tnb-note-list');
  const title = root.querySelector('.tnb-title');
  const body = root.querySelector('.tnb-body');
  const count = root.querySelector('.tnb-count');
  const current = root.querySelector('.tnb-current');
  const announcement = root.querySelector('.tnb-announcement');
  const notes = [
    { title: 'Before I leave', body: `Pick up groceries
Charge the headphones
Back up the dotfiles` },
    { title: 'Useful commands', body: `hyprctl monitors
wpctl status` }
  ];
  let selected = 0;
  const number = index => String(index + 1).padStart(2, '0');
  function renderList() {
    list.replaceChildren();
    notes.forEach((note, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tnb-note';
      button.setAttribute('aria-pressed', String(index === selected));
      button.setAttribute('aria-label', note.title || 'Untitled note');
      const numeral = document.createElement('span');
      numeral.className = 'tnb-note-number';
      numeral.textContent = number(index);
      const label = document.createElement('span');
      label.className = 'tnb-note-title';
      label.textContent = note.title || 'Untitled note';
      button.append(numeral, label);
      button.addEventListener('click', () => {
        selected = index;
        showNote();
        list.children[index].focus();
        announcement.textContent = `Selected ${note.title || 'Untitled note'}`;
      });
      list.append(button);
    });
    count.textContent = String(notes.length).padStart(2, '0');
    current.textContent = number(selected);
  }
  function showNote() {
    title.value = notes[selected].title;
    body.value = notes[selected].body;
    renderList();
    XLR8Notes.updateCount();XLR8Notes.reveal(list,'[aria-pressed="true"]');
  }
  title.addEventListener('input', () => {
    notes[selected].title = title.value;
    const selectedButton = list.children[selected];
    selectedButton.querySelector('.tnb-note-title').textContent = title.value || 'Untitled note';
    selectedButton.setAttribute('aria-label', title.value || 'Untitled note');
  });
  body.addEventListener('input', () => { notes[selected].body = body.value; });
  root.querySelector('.tnb-new').addEventListener('click', () => {
    selected = XLR8Notes.add(notes, { title: '', body: '' });
    showNote();
    title.focus();
    announcement.textContent = 'New note created in this preview';
  });
  const design = { indexWidth: 150, rowHeight: 58 };
  function renderDesign() {
    root.style.setProperty('--tnb-index', `${design.indexWidth}px`);
    root.style.setProperty('--tnb-row', `${design.rowHeight}px`);
  }
  showNote();
  renderDesign();
  window.XLR8Preview.connect(settings => {
    design.indexWidth=settings.s0IndexWidth;design.rowHeight=settings.s1RowHeight;renderDesign();
    XLR8Notes.apply(settings,design.rowHeight,0);
    XLR8Notes.reveal(list,'[aria-pressed="true"]');
  });
})();
