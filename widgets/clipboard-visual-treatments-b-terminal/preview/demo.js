
    (()=>{
      const root=document.getElementById('tsugu-clip-looks');
      const $=s=>root.querySelector(s),$$=s=>Array.from(root.querySelectorAll(s));
      const state={selected:1,query:'',onlyPinned:false,texture:true,undo:null,entries:[
        {id:1,name:'Grid texture',type:'IMAGE',body:'Black and red square grid',pinned:false},
        {id:2,name:'Player design notes',type:'TEXT',body:'Keep the selected row red.\nUse the menu grid.\nKeep the glyph independent of audio.',pinned:false},
        {id:3,name:'Tsugumori repository',type:'LINK',body:'https://github.com/Aleph1-9012/Tsugumori',pinned:true},
        {id:4,name:'Theme palette',type:'IMAGE',body:'Black / red / warm grey',pinned:false}
      ]};
      function render(){
        root.dataset.texture=state.texture?'on':'off';
        const matches=state.entries.filter(e=>(!state.onlyPinned||e.pinned)&&(e.name+' '+e.body+' '+e.type).toLowerCase().includes(state.query.toLowerCase()));
        if(!matches.some(e=>e.id===state.selected))state.selected=matches[0]?.id??null;
        $$('.vl-row').forEach(row=>{const id=Number(row.dataset.row);row.hidden=!matches.some(e=>e.id===id);row.classList.toggle('is-selected',id===state.selected);row.querySelector('button').setAttribute('aria-pressed',String(id===state.selected));});
        const selected=state.entries.find(e=>e.id===state.selected);
        $('.vl-count').textContent=String(matches.length).padStart(2,'0');
        $('.vl-list-title').textContent=state.onlyPinned?'PINNED':'RECENT';
        $('.vl-pin-filter').setAttribute('aria-pressed',String(state.onlyPinned));
        $('.vl-empty').hidden=matches.length>0;
        $('.vl-texture-sample').hidden=selected?.id!==1;
        $('.vl-palette-sample').hidden=selected?.id!==4;
        $('.vl-preview-text').hidden=!selected||selected.type==='IMAGE';
        $('.vl-preview-text').textContent=selected?.body??'';
        $('.vl-preview-label').textContent=selected?selected.type+' // PREVIEW':'NO SELECTION';
        $('.vl-detail-caption').textContent=selected?selected.name:'';
        $('.vl-detail-pin').hidden=!selected?.pinned;
        $('.vl-pin').setAttribute('aria-pressed',String(!!selected?.pinned));
        $('.vl-pin').setAttribute('aria-label',selected?.pinned?'Unpin selected entry':'Pin selected entry');
        $('.vl-pin').disabled=!selected;$('.vl-delete').disabled=!selected;$('[data-action="use"]').disabled=!selected;
        $('.vl-status').textContent=String(state.entries.length).padStart(2,'0')+' entries // sample content';
        $('.vl-undo').hidden=!state.undo;
      }
      function close(value){$('.vl-open').hidden=value;$('.vl-closed').hidden=!value;$('.vl-close').disabled=value;if(value)$('[data-action="reopen"]').focus();}
      root.addEventListener('click',event=>{
        const choice=event.target.closest('[data-style]');if(choice){root.dataset.look=choice.dataset.style;$$('[data-style]').forEach(button=>button.setAttribute('aria-pressed',String(button===choice)));close(false);return;}
        const row=event.target.closest('[data-entry]');if(row){state.selected=Number(row.dataset.entry);render();return;}
        const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
        const selected=state.entries.find(e=>e.id===state.selected);
        if(button.dataset.action==='filter'){state.onlyPinned=!state.onlyPinned;render();}
        if(button.dataset.action==='pin'&&selected){selected.pinned=!selected.pinned;render();}
        if(button.dataset.action==='delete'&&selected){state.undo={entry:selected,index:state.entries.indexOf(selected)};state.entries=state.entries.filter(e=>e.id!==selected.id);render();$('.vl-status').textContent='Entry removed // sample only';}
        if(button.dataset.action==='undo'&&state.undo){state.entries.splice(state.undo.index,0,state.undo.entry);state.selected=state.undo.entry.id;state.undo=null;render();}
        if(button.dataset.action==='use'&&selected){$('.vl-status').textContent='Restore simulated // '+String(selected.id).padStart(2,'0');}
        if(button.dataset.action==='close')close(true);
        if(button.dataset.action==='reopen'){close(false);$('.vl-search').focus();}
      });
      $('.vl-search').addEventListener('input',event=>{state.query=event.target.value;render();});
      root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close(true);}});
      render();
      if(globalThis.Tweak){const tweak=new Tweak({container:root,onChange:render});tweak.addToggle(state,'texture',{label:'Surface texture'});}
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-style=\"b\"]"}], "remove": ["button[data-style]"], "controls": false});
