
    (() => {
      const root=document.getElementById('ts-clip-studies');
      const one=s=>root.querySelector(s), all=s=>Array.from(root.querySelectorAll(s));
      const pinIcon='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 2h6M6 2v4l-2 3v1h8V9l-2-3V2M8 10v4"/></svg>';
      const menuImage='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 228" role="img" aria-label="Sample Tsugumori menu capture"><rect width="400" height="228" fill="#111112"/><g stroke="#49191d" stroke-width=".55"><path d="M0 24H400M0 48H400M0 72H400M0 96H400M0 120H400M0 144H400M0 168H400M0 192H400M0 216H400M24 0V228M48 0V228M72 0V228M96 0V228M120 0V228M144 0V228M168 0V228M192 0V228M216 0V228M240 0V228M264 0V228M288 0V228M312 0V228M336 0V228M360 0V228M384 0V228"/></g><path d="M0 1H400" stroke="#d4161c" stroke-width="2"/><text x="18" y="26" font-family="sans-serif" font-size="10" fill="#cbc7c5" letter-spacing="3">SYSTEM</text><path d="M91 22h18" stroke="#9a9191"/><text x="120" y="26" font-family="sans-serif" font-size="9" fill="#9c9191">システム</text><path d="M100 40V198" stroke="#41292c"/><rect y="49" width="100" height="27" fill="#d4161c"/><rect x="101" y="121" width="299" height="32" fill="#d4161c"/><g font-family="sans-serif" font-size="9" letter-spacing="1"><text x="15" y="66" fill="#140708">ALL</text><text x="15" y="99" fill="#a19192">DEVELOP</text><text x="15" y="133" fill="#a19192">SYSTEM</text><text x="15" y="167" fill="#a19192">GRAPHICS</text><text x="118" y="66" fill="#cb272d">01 // Alacritty</text><text x="118" y="100" fill="#cb272d">02 // Files</text><text x="118" y="141" fill="#180607">03 // Quick notes</text><text x="118" y="176" fill="#cb272d">04 // Vivaldi</text></g><path d="M0 200H400" stroke="#673033"/><text x="20" y="218" font-family="sans-serif" font-size="8" letter-spacing="2" fill="#a09090">TERMINAL     FILES     LOCK     SHUTDOWN</text></svg>';
      const paletteImage='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 228" role="img" aria-label="Sample black, red and off-white palette sheet"><rect width="400" height="228" fill="#0d0d0f"/><path d="M20 20h360v188H20z" fill="none" stroke="#5e2b30"/><text x="36" y="46" font-family="sans-serif" font-size="10" fill="#aa999a" letter-spacing="2">TSUGUMORI // PALETTE</text><rect x="36" y="66" width="150" height="110" fill="#d4161c"/><rect x="197" y="66" width="79" height="110" fill="#4f151c"/><rect x="287" y="66" width="77" height="110" fill="#c7c4c2"/><g font-family="monospace" font-size="9" fill="#9d898b"><text x="36" y="194">01 / SIGNAL</text><text x="197" y="194">02 / LOW</text><text x="287" y="194">03 / INK</text></g></svg>';
      const original=[
        {id:1,name:'Menu capture',type:'IMAGE',age:'JUST NOW',detail:'Copied image',image:menuImage,body:'Tsugumori menu capture',pinned:false},
        {id:2,name:'Player layout notes',type:'TEXT',age:'2 MIN AGO',detail:'3 lines',body:'Keep the selected row red.\nMatch the grid from the menu.\nKeep the glyph independent of audio.',pinned:false},
        {id:3,name:'Tsugumori repository',type:'LINK',age:'4 MIN AGO',detail:'github.com',body:'https://github.com/Aleph1-9012/Tsugumori',pinned:true},
        {id:4,name:'Palette study',type:'IMAGE',age:'7 MIN AGO',detail:'Copied image',image:paletteImage,body:'Tsugumori black and red palette',pinned:false}
      ];
      const state={layout:'a',selected:1,query:'',pinnedOnly:false,entries:original.map(e=>({...e})),gridStrength:9.5,undo:null};
      let inspectorId=null, previousFocus=null;
      const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const number=e=>String(original.findIndex(v=>v.id===e.id)+1).padStart(2,'0');
      const selectedEntry=()=>state.entries.find(e=>e.id===state.selected);
      const visibleEntries=()=>state.entries.filter(e=>(!state.pinnedOnly||e.pinned)&&(e.name+' '+e.body+' '+e.type).toLowerCase().includes(state.query.toLowerCase()));
      const typeMark=e=>e.type==='LINK'?'↗':'T';
      const content=e=>e.image?e.image:'<pre>'+escape(e.body)+'</pre>';
      function actionButtons(e){return '<button class="cs-icon" data-action="pin" data-entry="'+e.id+'" aria-label="'+(e.pinned?'Unpin':'Pin')+' '+escape(e.name)+'" aria-pressed="'+e.pinned+'">'+pinIcon+'</button><button class="cs-icon" data-action="delete" data-entry="'+e.id+'" aria-label="Delete '+escape(e.name)+'">×</button>';}
      function row(e,layout){
        const num='<span class="cs-num">'+number(e)+'//</span>', diamond='<span class="cs-diamond" aria-hidden="true">◈</span>';
        const attr=' data-entry="'+e.id+'"', pick='<button class="cs-pick" data-action="select"'+attr+' aria-label="Preview '+escape(e.name)+'" aria-pressed="false">';
        let body='';
        if(layout==='a') body=pick+'<span class="cs-row-head">'+num+(e.image?'<span class="cs-thumb cs-media">'+e.image+'</span>':'<span class="cs-txt-icon">'+typeMark(e)+'</span>')+'<span class="cs-row-copy"><span class="cs-entry-name">'+escape(e.name)+'</span><span class="cs-caption">'+e.type+' / '+e.age+'</span></span>'+diamond+'</span></button><div class="cs-row-actions">'+actionButtons(e)+'</div>';
        if(layout==='b') body=pick+'<div class="cs-mini">'+(e.image||'<div class="cs-mini-text">'+escape(e.body)+'</div>')+'</div><span class="cs-row-head">'+num+'<span>'+e.type+'</span>'+diamond+'</span></button>';
        if(layout==='c') body=pick+'<div class="cs-tile-body">'+content(e)+'</div><span class="cs-row-head">'+num+'<span class="cs-entry-name">'+escape(e.name)+'<span class="cs-caption">'+e.type+' / '+e.age+'</span></span>'+diamond+'</span></button>';
        if(layout==='d') body=pick+'<span class="cs-row-head">'+num+'<span class="cs-entry-name">'+escape(e.name)+'</span><span class="cs-fold-type">'+e.type+'</span>'+diamond+'</span></button><div class="cs-fold-body"><div class="cs-fold-inner"><div class="cs-fold-content">'+(e.image?'<div class="cs-media">'+e.image+'</div>':content(e))+'<div class="cs-fold-tools"><span class="cs-caption">'+e.age+' / '+escape(e.detail)+'</span>'+actionButtons(e)+'</div></div></div></div>';
        return '<article class="cs-entry" data-card="'+e.id+'">'+body+'</article>';
      }
      function build(){
        root.dataset.layout=state.layout; inspectorId=null;
        const entries=visibleEntries();
        if(!entries.some(e=>e.id===state.selected)) state.selected=entries[0]?.id??null;
        const rows=entries.map(e=>row(e,state.layout)).join('');
        let view='';
        if(!entries.length) view='<div class="cs-empty">'+(state.entries.length?'No matching clips':'No clips in this preview')+'</div>';
        else if(state.layout==='a') view='<div class="cs-history cs-index">'+rows+'</div>';
        else if(state.layout==='b') view='<section class="cs-inspector" aria-label="Selected clip"></section><div class="cs-strip">'+rows+'</div>';
        else if(state.layout==='c') view='<div class="cs-tiles">'+rows+'</div>';
        else view='<div class="cs-history cs-folds">'+rows+'</div>';
        one('.cs-layout-area').innerHTML=view;
        all('[data-layout-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layoutChoice===state.layout)));
        one('.cs-total').textContent=String(entries.length).padStart(2,'0')+' ENTRIES';
        one('.cs-scope-name').textContent=state.pinnedOnly?'PINNED COPIES':'RECENT COPIES';
        one('.cs-filter').setAttribute('aria-pressed',String(state.pinnedOnly));
        sync();
      }
      function sync(){
        root.style.setProperty('--cs-grid','rgba(162,28,34,'+(state.gridStrength/100)+')');
        const selected=selectedEntry();
        all('[data-card]').forEach(card=>{
          const active=Number(card.dataset.card)===state.selected;
          card.classList.toggle('is-selected',active);
          const button=card.querySelector('.cs-pick');button.setAttribute('aria-pressed',String(active));
          const fold=card.querySelector('.cs-fold-inner');if(fold){fold.inert=!active;fold.setAttribute('aria-hidden',String(!active));button.setAttribute('aria-expanded',String(active));}
        });
        if(state.layout==='b'&&selected&&inspectorId!==selected.id){
          one('.cs-inspector').innerHTML='<div class="cs-inspector-art cs-media">'+content(selected)+'</div><div><div class="cs-inspector-type">'+number(selected)+'// '+selected.type+'</div><h3 class="cs-inspector-name">'+escape(selected.name)+'</h3><div class="cs-inspector-meta">'+escape(selected.detail)+'<br>'+selected.age+'</div><div class="cs-inspector-actions">'+actionButtons(selected)+'</div></div>';
          inspectorId=selected.id;
        }
        one('[data-action="use"]').disabled=!selected;
        one('[data-action="preview"]').disabled=!selected;
        one('.cs-message').textContent=selected?number(selected)+'// '+selected.type+' · PREVIEW':'LOCAL // PREVIEW';
        one('[data-action="undo"]').hidden=!state.undo;
        const old=one('.cs-tile-tools');if(old)old.remove();
        if(state.layout==='c'&&selected){const tools=document.createElement('span');tools.className='cs-tile-tools';tools.innerHTML=actionButtons(selected);one('.cs-footer').insertBefore(tools,one('[data-action="preview"]'));}
      }
      function focusSelection(){const selected=one('[data-card="'+state.selected+'"] .cs-pick');if(selected)selected.focus({preventScroll:true});}
      function dismiss(){one('.cs-modal').hidden=true;if(previousFocus?.isConnected)previousFocus.focus();else one('[data-action="preview"]').focus();}
      function setClosed(closed){one('.cs-open-content').hidden=closed;one('.cs-closed').hidden=!closed;one('[data-action="close"]').disabled=closed;if(closed)one('[data-action="reopen"]').focus();}
      root.addEventListener('click',event=>{
        const layoutButton=event.target.closest('[data-layout-choice]');
        if(layoutButton){state.layout=layoutButton.dataset.layoutChoice;setClosed(false);one('.cs-modal').hidden=true;build();return;}
        const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
        const action=button.dataset.action,id=Number(button.dataset.entry),entry=state.entries.find(e=>e.id===id);
        if(action==='select'){state.selected=id;sync();}
        if(action==='filter'){state.pinnedOnly=!state.pinnedOnly;build();}
        if(action==='pin'&&entry){entry.pinned=!entry.pinned;build();one('.cs-message').textContent=(entry.pinned?'PINNED // ':'UNPINNED // ')+entry.name;}
        if(action==='delete'&&entry){state.undo={entry:{...entry},index:state.entries.findIndex(e=>e.id===id)};state.entries=state.entries.filter(e=>e.id!==id);build();one('.cs-message').textContent='ENTRY REMOVED';}
        if(action==='undo'&&state.undo){state.entries.splice(state.undo.index,0,state.undo.entry);state.selected=state.undo.entry.id;state.undo=null;build();}
        if(action==='use'&&selectedEntry()){one('.cs-message').textContent='RESTORE SIMULATED // '+number(selectedEntry());}
        if(action==='preview'&&selectedEntry()){previousFocus=button;one('.cs-modal-name').textContent=number(selectedEntry())+'// '+selectedEntry().name;one('.cs-modal-content').innerHTML=content(selectedEntry());one('.cs-modal').hidden=false;one('[data-action="dismiss"]').focus();}
        if(action==='dismiss')dismiss();
        if(action==='close')setClosed(true);
        if(action==='reopen'){setClosed(false);one('.cs-search').focus();}
      });
      one('.cs-search').addEventListener('input',event=>{state.query=event.target.value;build();});
      root.addEventListener('keydown',event=>{
        if(!one('.cs-modal').hidden){if(event.key==='Escape'){event.preventDefault();dismiss();}else if(event.key==='Tab'){event.preventDefault();one('[data-action="dismiss"]').focus();}return;}
        if(event.key==='Escape'){event.preventDefault();setClosed(true);return;}
        if(event.target.matches('input'))return;
        if(event.target.closest('.cs-entry')&&['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(event.key)){
          const entries=visibleEntries(),index=entries.findIndex(e=>e.id===state.selected),direction=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
          if(entries.length){event.preventDefault();state.selected=entries[(index+direction+entries.length)%entries.length].id;sync();focusSelection();}
        }
      });
      build();
      if(globalThis.Tweak){const tweak=new Tweak({container:root,onChange:sync});tweak.addSlider(state,'gridStrength',{label:'Grid contrast',min:0,max:18,step:.5,unit:'%'});}
    })();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-layout-choice=\"d\"]"}], "remove": ["button[data-layout-choice]"], "controls": false});
