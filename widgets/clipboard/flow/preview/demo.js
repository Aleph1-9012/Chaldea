// SPDX-License-Identifier: 0BSD
(() => {
      const root = document.getElementById('tsugu-clipboard-demo');
      const $ = selector => root.querySelector(selector);
      const artwork = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 160" role="img" aria-label="Sample red and black Tsugumori menu screenshot"><rect width="280" height="160" fill="#111112"/><g stroke="#521417" stroke-width=".5"><path d="M0 20H280M0 40H280M0 60H280M0 80H280M0 100H280M0 120H280M0 140H280M20 0V160M40 0V160M60 0V160M80 0V160M100 0V160M120 0V160M140 0V160M160 0V160M180 0V160M200 0V160M220 0V160M240 0V160M260 0V160"/></g><path d="M0 1H280" stroke="#d71920"/><text x="16" y="25" fill="#c5c2bf" font-family="monospace" font-size="10" letter-spacing="2">SYSTEM // システム</text><path d="M78 38V146" stroke="#40302e"/><rect y="46" width="77" height="22" fill="#d71920"/><rect x="79" y="91" width="201" height="26" fill="#d71920"/><g font-family="monospace" font-size="9"><text x="15" y="60" fill="#0d0d0e">ALL</text><text x="15" y="89" fill="#8f8584">DEVELOP</text><text x="15" y="111" fill="#8f8584">SYSTEM</text><text x="95" y="60" fill="#d71920">01 // Alacritty</text><text x="95" y="82" fill="#d71920">02 // Files</text><text x="95" y="108" fill="#0d0d0e">03 // Quick notes</text><text x="95" y="136" fill="#d71920">04 // Vivaldi</text></g></svg>';
      let entries = [
        {id:1, title:'Menu screenshot', kind:'IMAGE', age:'JUST NOW', image:true, body:'Sample Tsugumori menu screenshot', pinned:false},
        {id:2, title:'Tsugumori repository', kind:'LINK', age:'2 MIN AGO', body:'https://github.com/Aleph1-9012/Tsugumori', pinned:false},
        {id:3, title:'Player design notes', kind:'TEXT', age:'5 MIN AGO', body:'Keep the selected row red.\nUse the same grid as the menu.\nKeep the glyph independent of audio.', pinned:false},
        {id:4, title:'Theme accent', kind:'TEXT', age:'PINNED', body:'#d71920', pinned:true}
      ];
      let selected = 1, clipboard = null, onlyPinned = false;
      const design = {grid:true, density:'Comfortable'};
      function render() {
        const query = $('input').value.toLowerCase();
        const visible = entries.filter(entry => (!onlyPinned || entry.pinned) && (entry.title+' '+entry.body).toLowerCase().includes(query));
        if (!visible.some(entry => entry.id === selected)) selected = visible[0]?.id ?? null;
        $('.tc-list').replaceChildren();
        if (!visible.length) { const empty = document.createElement('div'); empty.className='tc-empty'; empty.textContent='No matching entries'; $('.tc-list').append(empty); }
        visible.forEach(entry => {
          const button = document.createElement('button'); button.className='tc-row'; button.type='button'; button.dataset.entry=String(entry.id); button.setAttribute('aria-pressed', String(entry.id===selected));
          const number = document.createElement('span'); number.className='tc-num'; number.textContent=String(entries.indexOf(entry)+1).padStart(2,'0')+'//';
          const label = document.createElement('span'); label.className='tc-rowtext';
          const title = document.createElement('strong'); title.textContent=entry.title;
          const meta = document.createElement('small'); meta.textContent=entry.kind+' · '+entry.age+(entry.pinned && entry.age!=='PINNED'?' · PINNED':'');
          label.append(title,meta); button.append(number,label);
          if(entry.id===selected) { const indicator=document.createElement('span'); indicator.textContent='◈'; indicator.setAttribute('aria-hidden','true'); button.append(indicator); }
          button.addEventListener('click',()=>{ selected=entry.id; render(); });
          $('.tc-list').append(button);
        });
        const entry = entries.find(item=>item.id===selected);
        $('.tc-preview-title').textContent=entry?entry.kind+' // PREVIEW':'PREVIEW';
        const body=$('.tc-preview-body'); body.replaceChildren();
        if(entry?.image) body.innerHTML=artwork; else body.textContent=entry?.body ?? '';
        $('.tc-preview-actions').hidden=!entry;
        $('.tc-pin').textContent=entry?.pinned?'UNPIN':'PIN';
        $('.tc-pin').setAttribute('aria-label',entry?.pinned?'Unpin selected entry':'Pin selected entry');
        $('.tc-count').textContent=String(entries.length).padStart(2,'0')+' ENTRIES';
        $('.tc-pinned').setAttribute('aria-pressed',String(onlyPinned));
        $('.tc-pinned').style.color=onlyPinned?'#d71920':'';
        $('.tc-drawer').style.backgroundImage=design.grid?'':'none';
        root.querySelectorAll('.tc-row').forEach(row=>{row.style.paddingBlock=design.density==='Compact'?'9px':'';});
      }
      function useEntry() {
        const entry = entries.find(item=>item.id===selected); if(!entry) return;
        clipboard={...entry}; $('.tc-drawer').hidden=true;
        $('.tc-pasted').textContent='Ready to paste: '+entry.title;
        $('.tc-paste').focus();
      }
      $('input').addEventListener('input',render);
      $('.tc-pinned').addEventListener('click',()=>{onlyPinned=!onlyPinned;render();});
      $('.tc-pin').addEventListener('click',()=>{const entry=entries.find(item=>item.id===selected);if(entry)entry.pinned=!entry.pinned;render();});
      $('.tc-delete').addEventListener('click',()=>{entries=entries.filter(item=>item.id!==selected);render();});
      $('.tc-use').addEventListener('click',useEntry);
      $('.tc-open').addEventListener('click',()=>{$('.tc-drawer').hidden=false;render();$('input').focus();});
      $('.tc-paste').addEventListener('click',()=>{if(!clipboard){$('.tc-pasted').textContent='Choose USE ENTRY in the history first.';return;}if(clipboard.image)$('.tc-pasted').innerHTML=artwork;else $('.tc-pasted').textContent=clipboard.body;});
      $('.tc-list').addEventListener('keydown',event=>{if(event.key==='Enter'){const row=event.target.closest('[data-entry]');if(row){event.preventDefault();selected=Number(row.dataset.entry);useEntry();}}});
      render();
      window.ChaldeaPreview.connect(settings => { Object.assign(design, settings); render(); });
    })();
