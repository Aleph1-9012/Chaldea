/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root = document.getElementById('ts-notes-c');
  const title = root.querySelector('.tnc-title');
  const body = root.querySelector('.tnc-body');
  const index = root.querySelector('.tnc-note-index');
  const toggle = root.querySelector('.tnc-notes-toggle');
  const count = root.querySelector('.tnc-note-count');
  const status = root.querySelector('[role="status"]');
  const notes = [
    { title:'Before I leave', body:'Pick up groceries\nCharge the headphones\nBack up the dotfiles' },
    { title:'Useful commands', body:'hyprctl monitors\nwpctl status' }
  ];
  let selected = 0;
  let expanded = false;
  const design = { spacing:'compact', heading:'white' };
  const serial = value => String(value).padStart(2, '0');
  function renderIndex() {
    index.replaceChildren();
    notes.forEach((note, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tnc-note-option';
      button.setAttribute('aria-current', String(i === selected));
      const number = document.createElement('span');
      number.className = 'tnc-note-number';
      number.textContent = serial(i + 1) + ' //';
      const label = document.createElement('span');
      label.className = 'tnc-note-name';
      label.textContent = note.title.trim() || 'Untitled note';
      button.append(number, label);
      button.addEventListener('click', () => {
        selected = i;
        expanded = false;
        renderSelected();
        toggle.focus();
        status.textContent = 'Opened ' + (notes[i].title.trim() || 'Untitled note');
      });
      index.append(button);
    });
    index.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = (expanded ? '↑ NOTES' : '↓ NOTES') + ' · ' + serial(notes.length);
    XLR8Notes.reveal(index,'[aria-current="true"]');
    count.textContent = 'NOTE ' + serial(selected + 1) + ' / ' + serial(notes.length);
  }
  function renderSelected() {
    title.value = notes[selected].title;
    body.value = notes[selected].body;
    renderIndex();
    XLR8Notes.updateCount();
  }
  title.addEventListener('input', () => { notes[selected].title = title.value; });
  body.addEventListener('input', () => { notes[selected].body = body.value; });
  toggle.addEventListener('click', () => { expanded = !expanded; renderIndex(); });
  root.querySelector('.tnc-new').addEventListener('click', () => {
    selected = XLR8Notes.add(notes, { title:'', body:'' });
    expanded = false;
    renderSelected();
    title.focus();
    status.textContent = 'New preview note';
  });
  function renderDesign() {
    root.dataset.spacing = design.spacing;
    root.dataset.heading = design.heading;
    XLR8Notes.updateCount();
  }
  renderSelected();
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded){event.preventDefault();expanded=false;renderIndex();toggle.focus();}});
  window.XLR8Preview.connect(settings => {
    design.spacing=settings.s0Spacing.toLowerCase();design.heading=settings.s1Heading==='Accent'?'red':'white';renderDesign();
    XLR8Notes.apply(settings,40,3);
    XLR8Notes.reveal(index,'[aria-current="true"]');
  });
})();
