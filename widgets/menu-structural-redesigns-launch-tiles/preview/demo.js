
    (() => {
      const root = document.getElementById('ts-menu-rebuild');
      const apps = [
        { id:1, name:'1Password', command:'1password', category:'OFFICE', glyph:'≡', description:'Passwords, passkeys and secure notes.' },
        { id:2, name:'Aether', command:'aether', category:'SYSTEM', glyph:'◇', description:'Aether application.' },
        { id:3, name:'Alacritty', command:'alacritty', category:'SYSTEM', glyph:'▸', description:'A terminal for your shell and command-line tools.' },
        { id:4, name:'Avahi SSH Server Browser', command:'bssh', category:'NETWORK', glyph:'○', description:'Find SSH servers advertised on your local network.' },
        { id:5, name:'Avahi VNC Server Browser', command:'bvnc', category:'NETWORK', glyph:'○', description:'Find shared desktops on your local network.' },
        { id:6, name:'Avahi Zeroconf Browser', command:'avahi-discover', category:'NETWORK', glyph:'○', description:'Browse services advertised on your local network.' },
        { id:7, name:'Brave', command:'brave-browser', category:'NETWORK', glyph:'○', description:'Web pages, saved tabs and bookmarks.' },
        { id:8, name:'btop++', command:'btop', category:'SYSTEM', glyph:'▲', description:'Inspect running processes and system resource usage.' },
        { id:9, name:'Calculator', command:'gnome-calculator', category:'OFFICE', glyph:'≡', description:'Everyday calculations and conversions.' },
        { id:10, name:'ChatGPT', command:'chatgpt', category:'NETWORK', glyph:'⌥', description:'Open your ChatGPT conversations.' }
      ];
      const state = { design:'b', selected:5, query:'', grid:11.5, row:44 };
      const index = root.querySelector('.tm-index-list');
      const compact = root.querySelector('.tm-compact-list');
      const tiles = root.querySelector('.tm-tile-list');
      const record = root.querySelector('.tm-record');
      const announcement = root.querySelector('.tm-announcement');
      const number = id => String(id).padStart(2,'0');
      const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const visibleApps = () => apps.filter(app => `${app.name} ${app.command}`.toLowerCase().includes(state.query.toLowerCase()));
      function makeAppButton(app, mode) {
        const id = number(app.id), name = escape(app.name), command = escape(app.command), description = escape(app.description);
        const selected = app.id === state.selected;
        const common = `type="button" data-app="${app.id}" aria-label="Select ${name}" aria-pressed="${selected}"`;
        if (mode === 'a') return `<button ${common} class="tm-index-row tm-button" style="--tm-jitter-x:${[0,-8,-3,-13,-4,-10,0,-5,-11][app.id%9]}px;--tm-jitter-y:${[0,-2,1,2,-1,0,2,-2,1][app.id%9]}px"><span class="tm-number">${id}</span><span class="tm-glyph" aria-hidden="true">${app.glyph}</span><span class="tm-index-name">${name}</span><span class="tm-index-category">${app.category}</span><span class="tm-diamond" aria-hidden="true"></span><span class="tm-index-extra"><span class="tm-description">${description}</span><br><span class="tm-command">${command}</span></span></button>`;
        if (mode === 'b') return `<button ${common} class="tm-compact-row tm-button"><span class="tm-number">${id}</span><span class="tm-compact-name">${name}</span><span class="tm-diamond" aria-hidden="true"></span></button>`;
        return `<button ${common} class="tm-tile tm-button"><span class="tm-tile-top"><span class="tm-tile-id"><span class="tm-glyph" aria-hidden="true">${app.glyph}</span>${id} //</span><span class="tm-diamond" aria-hidden="true"></span></span><span class="tm-tile-bottom"><span><span class="tm-tile-name">${name}</span><span class="tm-tile-category">${app.category}</span><span class="tm-tile-command">${command}</span></span></span></button>`;
      }
      function renderRecord() {
        const app = apps.find(item => item.id === state.selected);
        if (!app) { record.innerHTML = '<div class="tm-empty">No application selected.</div>'; return; }
        record.innerHTML = `<div class="tm-record-head"><div class="tm-record-ident"><span class="tm-glyph" aria-hidden="true">${app.glyph}</span><span>APPLICATION<br>RECORD</span></div><span class="tm-record-number">${number(app.id)}</span></div><h3 class="tm-record-title">${escape(app.name)}</h3><div class="tm-record-band"><span class="tm-diamond" aria-hidden="true"></span>${app.category}</div><p class="tm-description">${escape(app.description)}</p><div class="tm-command-record"><span aria-hidden="true">//</span><span class="tm-command">${escape(app.command)}</span></div><button type="button" class="tm-open" aria-label="Preview opening ${escape(app.name)}"><span>OPEN APPLICATION</span><span class="tm-open-mark" aria-hidden="true">↗</span></button>`;
      }
      function updateSelection() {
        root.querySelectorAll('[data-app]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.app) === state.selected)));
        renderRecord();
        root.querySelector('.tm-summary-text').textContent = state.selected === null ? 'NO MATCHING APPLICATIONS' : `${number(state.selected)} // SELECTED`;
      }
      function renderLists() {
        const filtered = visibleApps();
        if (!filtered.some(app => app.id === state.selected)) state.selected = filtered[0]?.id ?? null;
        [[index,'a'],[compact,'b'],[tiles,'c']].forEach(([container,mode]) => {
          container.innerHTML = filtered.length ? filtered.map(app => makeAppButton(app,mode)).join('') : '<div class="tm-empty">No matching applications.</div>';
        });
        root.querySelector('.tm-result-value').textContent = number(filtered.length);
        updateSelection();
      }
      function renderDesign() {
        root.dataset.design = state.design;
        root.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === state.design)));
        index.hidden = state.design !== 'a';
        root.querySelector('.tm-split').hidden = state.design !== 'b';
        tiles.hidden = state.design !== 'c';
        root.querySelector('.tm-section-label').textContent = { a:'APPLICATION INDEX', b:'APPLICATION CATALOG', c:'LAUNCH DIRECTORY' }[state.design];
        root.style.setProperty('--tm-grid', `rgba(204,21,21,${state.grid / 100})`);
        root.style.setProperty('--tm-row', `${state.row}px`);
      }
      root.addEventListener('click', event => {
        const choice = event.target.closest('[data-choice]');
        if (choice) { state.design = choice.dataset.choice; renderDesign(); return; }
        const appButton = event.target.closest('[data-app]');
        if (appButton) {
          state.selected = Number(appButton.dataset.app);
          updateSelection();
          announcement.textContent = `${apps.find(app => app.id === state.selected).name} selected.`;
        }
        if (event.target.closest('.tm-open')) {
          const app = apps.find(item => item.id === state.selected);
          root.querySelector('.tm-summary-text').textContent = 'PREVIEW ONLY // NOTHING LAUNCHED';
          announcement.textContent = `Preview only. ${app.name} would open in the live menu.`;
        }
      });
      root.querySelector('#tm-query').addEventListener('input', event => {
        state.query = event.target.value;
        renderLists();
        announcement.textContent = `${visibleApps().length} matching applications.`;
      });
      root.querySelector('.tm-surface').addEventListener('keydown', event => {
        if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(event.key)) return;
        if (event.target.matches('input') && ['ArrowLeft','ArrowRight'].includes(event.key)) return;
        const filtered = visibleApps();
        if (!filtered.length) return;
        const horizontal = ['ArrowLeft','ArrowRight'].includes(event.key);
        if (horizontal && state.design !== 'c') return;
        event.preventDefault();
        const step = state.design === 'c' && !horizontal ? 2 : 1;
        const direction = ['ArrowDown','ArrowRight'].includes(event.key) ? 1 : -1;
        const current = filtered.findIndex(app => app.id === state.selected);
        state.selected = filtered[(current + step * direction + filtered.length) % filtered.length].id;
        updateSelection();
        const activeList = { a:index, b:compact, c:tiles }[state.design];
        if (!event.target.matches('input')) activeList.querySelector(`[data-app="${state.selected}"]`).focus({preventScroll:true});
        announcement.textContent = `${apps.find(app => app.id === state.selected).name} selected.`;
      });
      renderLists();
      renderDesign();
      if (globalThis.Tweak) {
        const tweak = new Tweak({ container:root.querySelector('.tm-surface'), onChange:renderDesign });
        tweak.addSlider(state,'grid',{label:'Red grid strength',min:6,max:20,step:.5,unit:'%'});
        tweak.addSlider(state,'row',{label:'Index row height',min:40,max:52,step:2,unit:'px'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"c\"]"}], "remove": ["button[data-choice]"], "controls": false});
