
    (() => {
      const root = document.getElementById('ts-menu-row-studies');
      const get = selector => root.querySelector(selector);
      const appList = get('.rs-apps');
      const search = get('input');
      const announcement = get('.rs-announcement');
      const apps = [
        {name:'1Password',command:'1password',category:'OFFICE',glyph:'≡'},
        {name:'Aether',command:'aether',category:'SYSTEM',glyph:'◇'},
        {name:'Alacritty',command:'alacritty',category:'SYSTEM',glyph:'▸'},
        {name:'Avahi SSH Server Browser',command:'bssh',category:'NETWORK',glyph:'○'},
        {name:'Avahi VNC Server Browser',command:'bvnc',category:'NETWORK',glyph:'○'},
        {name:'Avahi Zeroconf Browser',command:'avahi-discover',category:'NETWORK',glyph:'○'},
        {name:'Brave',command:'brave-browser',category:'NETWORK',glyph:'○'},
        {name:'btop++',command:'btop',category:'SYSTEM',glyph:'▲'},
        {name:'Calculator',command:'gnome-calculator',category:'OFFICE',glyph:'≡'},
        {name:'ChatGPT',command:'chatgpt',category:'NETWORK',glyph:'⌥'}
      ].map((app,index) => ({...app,id:index + 1}));
      const descriptions = {
        current:'Reference · spaced sans serif · boxed glyphs',
        a:'JetBrains Mono · compact tracking · square glyph tiles',
        b:'IBM Plex Sans Condensed · uppercase · separate index rail',
        c:'Inter · soft-white titles · open corners'
      };
      const settings = {height:54,grid:9};
      let selectedId = 5;
      let shown = apps;
      function select(id,announce = true) {
        selectedId = id;
        appList.querySelectorAll('.rs-app').forEach(button => {
          const active = Number(button.dataset.id) === id;
          button.classList.toggle('rs-selected',active);
          button.setAttribute('aria-pressed',String(active));
        });
        if (announce) announcement.textContent = 'Selected ' + (apps.find(app => app.id === id)?.name || 'no application');
      }
      function populate() {
        const term = search.value.trim().toLowerCase();
        shown = apps.filter(app => (app.name + ' ' + app.command).toLowerCase().includes(term));
        if (!shown.some(app => app.id === selectedId)) selectedId = shown[0]?.id || 0;
        appList.replaceChildren();
        for (const app of shown) {
          const variant = app.id % 9;
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'rs-app';
          button.dataset.id = String(app.id);
          button.setAttribute('aria-label','Select ' + app.name);
          button.style.setProperty('--rs-category-x',[0,30,9,44,18,4,36,13,24][variant] + 'px');
          button.style.setProperty('--rs-category-y',[-1,-4,2,5,-2,3,-5,1,0][variant] + 'px');
          button.style.setProperty('--rs-category-tracking',[2.1,1.1,2.7,1.5,3.1,1.8,2.4,1.3,2.9][variant] + 'px');
          button.innerHTML = '<span class="rs-number">' + String(app.id).padStart(2,'0') + '</span><span class="rs-symbol" aria-hidden="true">' + app.glyph + '</span><span class="rs-copy"><span class="rs-name">' + app.name + '</span><span class="rs-command">' + app.command + '</span></span><span class="rs-category">' + app.category + '</span><span class="rs-marker" aria-hidden="true"></span>';
          button.addEventListener('click',() => select(app.id));
          appList.append(button);
        }
        if (!shown.length) {
          const empty = document.createElement('div');
          empty.className = 'rs-empty';
          empty.textContent = 'NO APPLICATIONS FOUND';
          appList.append(empty);
        }
        get('.rs-search-meta').textContent = term ? String(shown.length).padStart(2,'0') : '検索';
        announcement.textContent = term ? shown.length + ' matching applications' : 'All ' + apps.length + ' applications';
        select(selectedId,false);
      }
      function setStyle(style) {
        root.dataset.style = style;
        root.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.choice === style)));
        get('.rs-caption').textContent = descriptions[style];
        get('.rs-search-prefix').textContent = style === 'a' ? '/' : '▸';
        search.placeholder = style === 'current' ? 'search application…' : 'Find an application…';
      }
      root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click',() => setStyle(button.dataset.choice)));
      search.addEventListener('input',populate);
      get('.rs-pane').addEventListener('keydown',event => {
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && shown.length) {
          event.preventDefault();
          const oldIndex = shown.findIndex(app => app.id === selectedId);
          const index = (oldIndex + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
          select(shown[index].id);
          if (event.target !== search) appList.querySelector('[data-id="' + selectedId + '"]').focus();
        }
        if (event.key === 'Enter' && event.target === search) {
          event.preventDefault();
          announcement.textContent = selectedId ? 'Preview only. Selected ' + apps.find(app => app.id === selectedId).name : 'No application selected';
        }
      });
      function applySettings() {
        root.style.setProperty('--rs-row-height',settings.height + 'px');
        root.style.setProperty('--rs-grid','rgba(204,21,21,' + settings.grid / 100 + ')');
      }
      populate(); setStyle('a'); applySettings();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:get('.rs-pane'),onChange:applySettings});
        tweak.addSlider(settings,'height',{label:'Row spacing',min:48,max:64,step:2,unit:'px'});
        tweak.addSlider(settings,'grid',{label:'Red grid opacity',min:5,max:15,unit:'%'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"current\"]"}], "remove": ["button[data-choice]"], "controls": false});
