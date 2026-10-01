
    (() => {
      const root = document.getElementById('tsugumori-menu-refinement');
      const query = selector => root.querySelector(selector);
      const search = query('.tm-search-input');
      const menu = query('.tm-menu');
      const appList = query('.tm-apps');
      const categories = query('.tm-categories');
      const clearSearch = query('.tm-search-clear');
      const status = query('.tm-action-state');
      const apps = [
        {name:'Alacritty', category:'sys', command:'alacritty', glyph:'▸'},
        {name:'Brave', category:'net', command:'brave-browser', glyph:'○'},
        {name:'btop++', category:'sys', command:'btop', glyph:'▲'},
        {name:'GIMP', category:'graphics', command:'gimp', glyph:'◇'},
        {name:'LibreOffice Writer', category:'office', command:'libreoffice --writer', glyph:'≡'},
        {name:'mpv', category:'media', command:'mpv', glyph:'▸'},
        {name:'Steam', category:'games', command:'steam', glyph:'⊕'},
        {name:'VSCodium', category:'dev', command:'codium', glyph:'⌥'}
      ].map((app,index) => ({...app, id:index+1}));
      const labels = {all:'ALL',dev:'DEVELOP',sys:'SYSTEM',net:'NETWORK',media:'MEDIA',office:'OFFICE',graphics:'GRAPHICS',games:'GAMES'};
      let category = 'all';
      let selectedId = 3;
      let filtered = apps.slice();
      let notificationTimer;
      let reopenTimer;
      const design = { typography:'mixed', spacing:'compact', grid:8, categoryStyle:'band' };
      const pad = value => String(value).padStart(2,'0');
      function defaultStatus() { status.textContent = category === 'all' ? 'ALL APPLICATIONS' : labels[category] + ' APPLICATIONS'; }
      function announceAction(action) {
        clearTimeout(notificationTimer);
        status.textContent = action.toUpperCase() + ' // PREVIEW ONLY';
        notificationTimer = setTimeout(defaultStatus, 2500);
      }
      function applySelection() {
        appList.querySelectorAll('.tm-app-row').forEach(button => {
          const active = Number(button.dataset.id) === selectedId;
          button.classList.toggle('tm-selected', active);
          button.setAttribute('aria-pressed', String(active));
        });
      }
      function select(id) { selectedId = id; applySelection(); }
      function renderApps() {
        const term = search.value.trim().toLowerCase();
        filtered = apps.filter(app => (category === 'all' || app.category === category) && (app.name + ' ' + app.command).toLowerCase().includes(term));
        if (!filtered.some(app => app.id === selectedId)) selectedId = filtered[0]?.id ?? null;
        appList.replaceChildren();
        for (const app of filtered) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'tm-app-row'; button.dataset.id = app.id;
          button.setAttribute('aria-label', app.name + ', ' + labels[app.category]);
          button.innerHTML = '<span class="tm-app-icon" aria-hidden="true">' + app.glyph + '</span><span class="tm-app-info"><span class="tm-title-line"><span class="tm-app-number">' + pad(app.id) + '//</span><span class="tm-app-name">' + app.name + '</span></span><span class="tm-app-meta">' + app.command + '</span></span><span class="tm-app-category">' + labels[app.category] + '</span><span class="tm-selection-mark" aria-hidden="true"></span>';
          button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') select(app.id); });
          button.addEventListener('focus', () => select(app.id));
          button.addEventListener('click', () => { select(app.id); announceAction(app.name); });
          appList.append(button);
        }
        if (!filtered.length) {
          const empty = document.createElement('div'); empty.className = 'tm-empty'; empty.textContent = 'NO MATCHING APPLICATIONS'; appList.append(empty);
        }
        query('.tm-node-count').textContent = pad(filtered.length) + '/' + pad(apps.length) + ' NODES';
        query('.tm-node-fill').style.width = (filtered.length / apps.length * 100) + '%';
        clearSearch.classList.toggle('tm-has-query', search.value.length > 0);
        clearSearch.disabled = !search.value.length;
        applySelection();
      }
      for (const [key,label] of Object.entries(labels)) {
        const count = key === 'all' ? apps.length : apps.filter(app => app.category === key).length;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'tm-category'; button.dataset.category = key;
        button.setAttribute('aria-pressed', String(key === category)); button.setAttribute('aria-label', label + ', ' + count + ' applications');
        button.innerHTML = '<span class="tm-category-mark" aria-hidden="true"></span><span>' + label + '</span><span class="tm-category-count">' + pad(count) + '</span>';
        button.addEventListener('click', () => {
          category = key; clearTimeout(notificationTimer);
          categories.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.category === category)));
          defaultStatus(); renderApps();
        });
        categories.append(button);
      }
      search.addEventListener('input', renderApps);
      clearSearch.addEventListener('click', () => { search.value = ''; renderApps(); search.focus({preventScroll:true}); });
      function closeMenu() {
        clearTimeout(reopenTimer); root.classList.add('tm-closed'); menu.inert = true;
        query('.tm-reopen').focus({preventScroll:true});
      }
      query('.tm-close').addEventListener('click', closeMenu);
      query('.tm-reopen').addEventListener('click', () => {
        root.classList.remove('tm-closed'); menu.inert = false;
        reopenTimer = setTimeout(() => search.focus({preventScroll:true}), 500);
      });
      root.addEventListener('keydown', event => {
        if (root.classList.contains('tm-closed')) return;
        if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
        else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && filtered.length) {
          event.preventDefault();
          const old = filtered.findIndex(app => app.id === selectedId);
          const next = Math.max(0,Math.min(filtered.length-1,old + (event.key === 'ArrowDown' ? 1 : -1)));
          select(filtered[next].id);
        } else if (event.key === 'Enter' && event.target === search) {
          event.preventDefault(); const app = filtered.find(item => item.id === selectedId); if (app) announceAction(app.name);
        }
      });
      root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => announceAction(button.dataset.action)));
      const clock = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date());
      query('.tm-clock').textContent = clock;
      query('.tm-header-count').textContent = pad(apps.length) + ' APPS';
      function renderDesign() {
        root.style.setProperty('--tm-text', design.typography === 'mono' ? 'var(--tm-mono)' : "'Inter', sans-serif");
        root.style.setProperty('--tm-row-height', design.spacing === 'compact' ? '54px' : '62px');
        root.style.setProperty('--tm-grid', 'rgba(204,21,21,' + design.grid/100 + ')');
        root.dataset.categoryStyle = design.categoryStyle;
      }
      renderApps(); renderDesign();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:renderDesign});
        tweak.addSelect(design,'typography',{label:'App typography',options:[{label:'Inter + mono labels',value:'mixed'},{label:'All monospace',value:'mono'}]});
        tweak.addSelect(design,'spacing',{label:'Row spacing',options:[{label:'Compact',value:'compact'},{label:'Airy',value:'airy'}]});
        tweak.addSelect(design,'categoryStyle',{label:'Active category',options:[{label:'Red band',value:'band'},{label:'Red edge',value:'edge'}]});
        tweak.addSlider(design,'grid',{label:'Grid visibility',min:4,max:16,step:1,unit:'%'});
      }
    })();


window.XLR8Archive.finish({"controls": false});
