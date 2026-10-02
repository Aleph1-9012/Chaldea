/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root=document.getElementById('ts-notes-preview');
  const list=root.querySelector('[data-note-list]');
  const title=root.querySelector('[data-title]');
  const body=root.querySelector('[data-body]');
  const status=root.querySelector('[data-status]');
  const collapse=root.querySelector('[data-collapse]');
  const drawerBody=root.querySelector('#ts-notes-body');
  const notes=[
    {title:'Before I leave',body:'Pick up groceries\nCharge the headphones\nBack up the dotfiles'},
    {title:'Useful commands',body:'Check monitor names\nhyprctl monitors\n\nCheck audio outputs\nwpctl status'}
  ];
  let active=0;
  let open=true;
  let updateTimer;
  const design={width:414,rule:true};
  function renderDesign() { root.style.setProperty('--ts-drawer-width',`${design.width}px`); root.dataset.rule=String(design.rule); }
  function renderList() {
    list.replaceChildren();
    notes.forEach((note,index) => {
      const item=document.createElement('button'); item.type='button'; item.className='ts-note-item'; item.setAttribute('aria-pressed',String(index===active));
      const number=document.createElement('span'); number.className='ts-note-number'; number.textContent=String(index+1).padStart(2,'0');
      const label=document.createElement('span'); label.className='ts-note-title'; label.textContent=note.title.trim()||'Untitled note';
      item.append(number,label);
      item.addEventListener('click',() => { active=index; renderEditor(); list.children[index].focus(); });
      list.appendChild(item);
    });
    root.querySelector('[data-note-position]').textContent=`ENTRY ${String(active+1).padStart(2,'0')} / ${String(notes.length).padStart(2,'0')}`;
  }
  function renderEditor() { title.value=notes[active].title; body.value=notes[active].body; renderList(); ChaldeaNotes.updateCount();ChaldeaNotes.reveal(list,'[aria-pressed="true"]'); }
  function updateNote() {
    notes[active].title=title.value; notes[active].body=body.value;
    const activeLabel=list.children[active]?.querySelector('.ts-note-title');
    if(activeLabel) activeLabel.textContent=title.value.trim()||'Untitled note';
    clearTimeout(updateTimer);
    updateTimer=setTimeout(() => { status.textContent='UPDATED IN PREVIEW'; },500);
  }
  function setOpen(value) {
    open=value; root.dataset.open=String(open); drawerBody.hidden=!open;
    collapse.setAttribute('aria-expanded',String(open)); collapse.setAttribute('aria-label',open?'Close notes drawer':'Open notes drawer');
    if(!open) collapse.focus();
  }
  title.addEventListener('input',updateNote); body.addEventListener('input',updateNote);
  collapse.addEventListener('click',() => setOpen(!open));
  root.addEventListener('keydown',event => { if(event.key==='Escape' && open) { event.preventDefault(); setOpen(false); } });
  root.querySelector('[data-add]').addEventListener('click',() => {
    active=ChaldeaNotes.add(notes,{title:'',body:''}); renderEditor();
    title.placeholder='Untitled note'; body.placeholder='Write something to remember...';
    status.textContent='NEW PREVIEW NOTE'; title.focus();
  });
  renderEditor(); renderDesign();
  window.ChaldeaPreview.connect(settings => {
    design.width=settings.s0Width;design.rule=settings.s1Rule;renderDesign();
    ChaldeaNotes.apply(settings,40,3);
    ChaldeaNotes.reveal(list,'[aria-pressed="true"]');
  });
})();
