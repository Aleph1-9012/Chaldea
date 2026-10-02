// SPDX-License-Identifier: 0BSD
(()=>{
      const root=document.getElementById('tsugu-clipboard-fit');
      const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
      const design={paper:'bone',grid:true};
      const state={selected:1,query:'',pinnedOnly:false,undo:null,entries:[
        {id:1,name:'Grid texture',type:'IMAGE',body:'Black and red grid texture',pinned:false},
        {id:2,name:'Player design notes',type:'TEXT',body:'Keep the selected row red.\nUse the menu grid.\nKeep the glyph independent of audio.',pinned:false},
        {id:3,name:'Tsugumori repository',type:'LINK',body:'https://github.com/Aleph1-9012/Tsugumori',pinned:true},
        {id:4,name:'Theme palette',type:'IMAGE',body:'Black / red / bone',pinned:false}
      ]};
      const visible=()=>state.entries.filter(e=>(!state.pinnedOnly||e.pinned)&&(e.name+' '+e.body+' '+e.type).toLowerCase().includes(state.query.toLowerCase()));
      function render(){
        root.dataset.paper=design.paper;root.dataset.grid=design.grid?'on':'off';
        const matches=visible();if(!matches.some(e=>e.id===state.selected))state.selected=matches[0]?.id??null;
        $$('.cr-row').forEach(row=>{const id=Number(row.dataset.row),entry=state.entries.find(e=>e.id===id);row.hidden=!matches.some(e=>e.id===id);row.classList.toggle('is-selected',id===state.selected);row.querySelector('button').setAttribute('aria-pressed',String(id===state.selected));row.querySelector('.cr-row-pin').hidden=!entry?.pinned;});
        const selected=state.entries.find(e=>e.id===state.selected);
        $('.cr-total').textContent=String(matches.length).padStart(2,'0');
        $('.cr-list-label').textContent=state.pinnedOnly?'PINNED COPIES':'RECENT COPIES';
        $('.cr-filter').setAttribute('aria-pressed',String(state.pinnedOnly));
        $('.cr-empty').hidden=matches.length>0;
        $('.cr-grid-sample').hidden=selected?.id!==1;$('.cr-palette').hidden=selected?.id!==4;
        $('.cr-text').hidden=!selected||selected.type==='IMAGE';$('.cr-text').textContent=selected?.body??'';
        $('.cr-detail-type').textContent=selected?String(selected.id).padStart(2,'0')+' / '+selected.type:'EMPTY';
        $('.cr-caption-name').textContent=selected?.name??'No clip selected';
        $('.cr-caption-kind').textContent=selected?'SAMPLE '+selected.type:'';
        $('.cr-pin').setAttribute('aria-pressed',String(!!selected?.pinned));
        $('.cr-pin').setAttribute('aria-label',selected?.pinned?'Unpin selected entry':'Pin selected entry');
        $('.cr-pin-label').textContent=selected?.pinned?'UNPIN':'PIN';
        $('.cr-pin').disabled=!selected;$('.cr-delete').disabled=!selected;$('[data-action="use"]').disabled=!selected;
        $('.cr-state').textContent=String(state.entries.length).padStart(2,'0')+' ENTRIES // PREVIEW';$('.cr-undo').hidden=!state.undo;
      }
      function close(value){$('.cr-open').hidden=value;$('.cr-closed').hidden=!value;$('.cr-close').disabled=value;if(value)$('[data-action="reopen"]').focus();}
      root.addEventListener('click',event=>{
        const entry=event.target.closest('[data-entry]');if(entry){state.selected=Number(entry.dataset.entry);render();return;}
        const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
        const selected=state.entries.find(e=>e.id===state.selected);
        if(button.dataset.action==='filter'){state.pinnedOnly=!state.pinnedOnly;render();}
        if(button.dataset.action==='pin'&&selected){selected.pinned=!selected.pinned;render();}
        if(button.dataset.action==='delete'&&selected){state.undo={entry:selected,index:state.entries.indexOf(selected)};state.entries=state.entries.filter(e=>e.id!==selected.id);render();$('.cr-state').textContent='ENTRY REMOVED';}
        if(button.dataset.action==='undo'&&state.undo){state.entries.splice(state.undo.index,0,state.undo.entry);state.selected=state.undo.entry.id;state.undo=null;render();}
        if(button.dataset.action==='use'&&selected){$('.cr-state').textContent='RESTORE SIMULATED // '+String(selected.id).padStart(2,'0');}
        if(button.dataset.action==='close')close(true);
        if(button.dataset.action==='reopen'){close(false);$('.cr-search').focus();}
      });
      $('.cr-search').addEventListener('input',event=>{state.query=event.target.value;render();});
      root.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();close(true);return;}
        if(event.target.closest('[data-entry]')&&['ArrowUp','ArrowDown'].includes(event.key)){const entries=visible(),index=entries.findIndex(e=>e.id===state.selected);if(entries.length){event.preventDefault();state.selected=entries[(index+(event.key==='ArrowDown'?1:-1)+entries.length)%entries.length].id;render();$('[data-entry="'+state.selected+'"]').focus();}}
      });
      render();
      window.XLR8Preview.connect(settings => { design.paper = settings.paper.toLowerCase(); design.grid = settings.grid; render(); });
    })();
