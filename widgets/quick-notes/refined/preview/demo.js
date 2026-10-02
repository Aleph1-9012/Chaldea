/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root=document.getElementById('ts-notes-refined');
  const index=root.querySelector('[data-index]');
  const title=root.querySelector('[data-title]');
  const body=root.querySelector('[data-body]');
  const close=root.querySelector('[data-close]');
  const content=root.querySelector('#tn-content');
  const status=root.querySelector('[data-status]');
  const editor=root.querySelector('[data-editor]');
  const empty=root.querySelector('[data-empty]');
  const add=root.querySelector('[data-add]');
  const recovery=root.querySelector('[data-recovery]');
  const undo=root.querySelector('[data-undo]');
  const recoveryMessage=root.querySelector('[data-deleted-message]');
  const notes=[{id:1,title:'Before I leave',body:'Pick up groceries\nCharge the headphones\nBack up the dotfiles'},{id:2,title:'Useful commands',body:'hyprctl monitors\nwpctl status'}];
  const deleted=[];
  const rows=new Map();
  let activeId=1,nextId=3,opened=true;
  const design={innerFrame:true,bodySize:16,noteFont:'mono',gridStrength:8,editorHeight:130,titleSize:18,listDensity:'Comfortable',visibleNotes:4,newNotePosition:'Bottom',textCount:'Off',showNumbers:true};
  const count=root.querySelector('[data-text-count]');
  const displayTitle=note=>note.title.trim()||'Untitled note';
  const noteLabel=i=>(design.showNumbers?String(i+1).padStart(2,'0')+'// ':'')+displayTitle(notes[i]);
  function renderDesign(){
    root.dataset.inner=String(design.innerFrame);
    root.style.setProperty('--tn-body-size',design.bodySize+'px');
    root.style.setProperty('--tn-note-font',design.noteFont==='mono'?"'Share Tech Mono',monospace":"Inter,sans-serif");
    root.style.setProperty('--tn-grid','rgba(var(--notes-accent-rgb,204,21,21),'+design.gridStrength/100+')');
  }
  function updateCount(){
    const text=body.value;
    const words=text.trim()?text.trim().split(/\s+/).length:0;
    const characters=Array.from(text).length;
    count.hidden=design.textCount==='Off';
    count.textContent=design.textCount==='Words'?words+(words===1?' word':' words'):design.textCount==='Characters'?characters+(characters===1?' character':' characters'):'';
  }
  function revealSelected(){
    const row=rows.get(activeId)?.row;
    if(!row)return;
    if(row.offsetTop<index.scrollTop)index.scrollTop=row.offsetTop;
    else if(row.offsetTop+row.offsetHeight>index.scrollTop+index.clientHeight)index.scrollTop=row.offsetTop+row.offsetHeight-index.clientHeight;
  }
  function refreshLabels(){
    notes.forEach((note,i)=>{
      const controls=rows.get(note.id);
      if(!controls)return;
      controls.select.textContent=noteLabel(i);
      controls.remove.setAttribute('aria-label','Delete '+noteLabel(i));
    });
  }
  function applySettings(settings){
    for(const key of ['editorHeight','titleSize','listDensity','visibleNotes','newNotePosition','textCount','showNumbers'])design[key]=settings[key];
    root.style.setProperty('--tn-editor-height',design.editorHeight+'px');
    body.style.height=design.editorHeight+'px';
    root.style.setProperty('--tn-title-size',design.titleSize+'px');
    const compact=design.listDensity==='Compact',spacious=design.listDensity==='Spacious';
    const height=compact?32:spacious?48:40,gap=compact?4:spacious?10:7;
    root.dataset.density=design.listDensity;
    root.style.setProperty('--tn-row-padding',(compact?4:spacious?12:8)+'px');
    root.style.setProperty('--tn-row-height',height+'px');
    root.style.setProperty('--tn-row-gap',gap+'px');
    root.style.setProperty('--tn-index-height',(design.visibleNotes*height+(design.visibleNotes-1)*gap)+'px');
    refreshLabels();updateCount();requestAnimationFrame(revealSelected);
  }
  function focusSelected(){
    const selected=index.querySelector('[aria-pressed="true"]');
    if(selected) selected.focus(); else add.focus();
  }
  function render(){
    // Keep surviving rows mounted so their fill can animate when deselected.
    const liveIds=new Set(notes.map(note=>note.id));
    for(const [id,controls] of rows){
      if(!liveIds.has(id)){controls.row.remove();rows.delete(id);}
    }
    notes.forEach((note,i)=>{
      let controls=rows.get(note.id);
      if(!controls){
        const row=document.createElement('div');row.className='tn-row tn-fill';row.dataset.noteId=String(note.id);
        const select=document.createElement('button');select.type='button';select.className='tn-note';
        const remove=document.createElement('button');remove.type='button';remove.className='tn-delete';remove.textContent='×';
        select.addEventListener('click',()=>{
          if(activeId===note.id)return;
          activeId=note.id;render();focusSelected();
        });
        remove.addEventListener('click',()=>deleteNote(note.id));
        row.append(select,remove);controls={row,select,remove};rows.set(note.id,controls);
      }
      controls.row.dataset.selected=String(note.id===activeId);
      controls.select.textContent=noteLabel(i);
      controls.select.setAttribute('aria-pressed',String(note.id===activeId));
      controls.remove.setAttribute('aria-label','Delete '+noteLabel(i));
      if(index.children[i]!==controls.row)index.insertBefore(controls.row,index.children[i]||null);
    });
    const active=notes.find(note=>note.id===activeId);
    editor.hidden=!active;empty.hidden=Boolean(active);
    title.value=active?active.title:'';body.value=active?active.body:'';
    root.querySelector('[data-count]').textContent=active?String(notes.indexOf(active)+1).padStart(2,'0')+' / '+String(notes.length).padStart(2,'0'):'';
    recovery.hidden=deleted.length===0;
    if(deleted.length) recoveryMessage.textContent='Deleted '+displayTitle(deleted[deleted.length-1].note);
    updateCount();requestAnimationFrame(revealSelected);
  }
  function update(){
    const i=notes.findIndex(note=>note.id===activeId);if(i<0)return;
    notes[i].title=title.value;notes[i].body=body.value;
    index.children[i].querySelector('.tn-note').textContent=noteLabel(i);
    index.children[i].querySelector('.tn-delete').setAttribute('aria-label','Delete '+noteLabel(i));
    status.textContent='EDITED / SESSION ONLY';
    updateCount();
  }
  function deleteNote(id){
    const i=notes.findIndex(note=>note.id===id);if(i<0)return;
    const removed=notes.splice(i,1)[0];deleted.push({note:removed,index:i});
    if(activeId===id)activeId=notes[Math.min(i,notes.length-1)]?.id??null;
    render();status.textContent='NOTE DELETED / UNDO AVAILABLE';undo.focus();
  }
  undo.addEventListener('click',()=>{
    const last=deleted.pop();if(!last)return;
    notes.splice(Math.min(last.index,notes.length),0,last.note);activeId=last.note.id;
    render();status.textContent='NOTE RESTORED / SESSION ONLY';focusSelected();
  });
  function toggle(){
    opened=!opened;root.dataset.open=String(opened);content.hidden=!opened;
    close.textContent=opened?'ESC':'OPEN';close.setAttribute('aria-label',opened?'Close drawer':'Open drawer');close.setAttribute('aria-expanded',String(opened));close.focus();
  }
  title.addEventListener('input',update);body.addEventListener('input',update);close.addEventListener('click',toggle);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened){event.preventDefault();toggle();}});
  add.addEventListener('click',()=>{
    const note={id:nextId++,title:'',body:''};
    if(design.newNotePosition==='Top'){
      notes.unshift(note);
      for(const entry of deleted)entry.index++;
    }else notes.push(note);
    activeId=note.id;
    render();status.textContent='NEW / SESSION ONLY';title.focus();
  });
  render();renderDesign();
  window.ChaldeaPreview.connect(settings => {
    design.innerFrame=settings.s0InnerFrame;
    design.bodySize=settings.s1BodySize;
    design.noteFont=settings.s2NoteFont==='Inter'?'sans':'mono';
    design.gridStrength=settings.s3GridStrength;
    renderDesign();applySettings(settings);window.ChaldeaNotesAppearance.apply(settings);
  });
})();
