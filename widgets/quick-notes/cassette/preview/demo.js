/* Quick notes interactions. Original code, 0BSD. */
(() => {
  const root=document.getElementById('ts-notes-a');
  const index=root.querySelector('[data-index]');
  const title=root.querySelector('[data-title]');
  const body=root.querySelector('[data-body]');
  const close=root.querySelector('[data-close]');
  const content=root.querySelector('#ta-content');
  const status=root.querySelector('[data-status]');
  const notes=[{title:'Before I leave',body:'Pick up groceries\nCharge the headphones\nBack up the dotfiles'},{title:'Useful commands',body:'hyprctl monitors\nwpctl status'}];
  let active=0,opened=true;
  const design={innerFrame:true,bodySize:16,showNumbers:false};
  function noteLabel(i){return (design.showNumbers?String(i+1).padStart(2,'0')+'//':'')+(notes[i].title.trim()||'Untitled note');}
  function renderDesign(){root.dataset.inner=String(design.innerFrame);root.style.setProperty('--ta-body-size',design.bodySize+'px');}
  function render(){
    index.replaceChildren();
    notes.forEach((note,i)=>{
      const button=document.createElement('button');button.type='button';button.className='ta-note';button.textContent=noteLabel(i);button.setAttribute('aria-pressed',String(i===active));
      button.addEventListener('click',()=>{active=i;render();index.children[i].focus();});index.appendChild(button);
    });
    title.value=notes[active].title;body.value=notes[active].body;
    root.querySelector('[data-count]').textContent=String(active+1).padStart(2,'0')+' / '+String(notes.length).padStart(2,'0');
    XLR8Notes.updateCount();XLR8Notes.reveal(index,'[aria-pressed="true"]');
  }
  function update(){notes[active]={title:title.value,body:body.value};index.children[active].textContent=noteLabel(active);status.textContent='EDITED / SESSION ONLY';}
  function toggle(){opened=!opened;root.dataset.open=String(opened);content.hidden=!opened;close.textContent=opened?'ESC':'OPEN';close.setAttribute('aria-label',opened?'Close notes':'Open notes');close.setAttribute('aria-expanded',String(opened));close.focus();}
  title.addEventListener('input',update);body.addEventListener('input',update);close.addEventListener('click',toggle);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened){event.preventDefault();toggle();}});
  root.querySelector('[data-add]').addEventListener('click',()=>{active=XLR8Notes.add(notes,{title:'',body:''});render();title.placeholder='Untitled note';body.placeholder='Write something to remember...';status.textContent='NEW / SESSION ONLY';title.focus();});
  render();renderDesign();
  window.XLR8Preview.connect(settings => {
    design.innerFrame=settings.s0InnerFrame;design.bodySize=settings.s1BodySize;design.showNumbers=settings.showNumbers;
    renderDesign();
    root.dataset.palette=settings.s2Palette;
    XLR8Notes.apply(settings);
    notes.forEach((note,i)=>{index.children[i].textContent=noteLabel(i);});
    XLR8Notes.reveal(index,'[aria-pressed="true"]');
  });
})();
