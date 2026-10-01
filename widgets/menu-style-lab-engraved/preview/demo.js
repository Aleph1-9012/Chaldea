
    (() => {
      const root = document.getElementById('ts-menu-style-lab');
      const apps = [
        {id:1,name:'1Password',cmd:'1password',cat:'OFFICE',glyph:'≡'},
        {id:2,name:'Aether',cmd:'aether',cat:'SYSTEM',glyph:'◇'},
        {id:3,name:'Alacritty',cmd:'alacritty',cat:'SYSTEM',glyph:'▸'},
        {id:4,name:'Avahi SSH Server Browser',cmd:'bssh',cat:'NETWORK',glyph:'○'},
        {id:5,name:'Avahi VNC Server Browser',cmd:'bvnc',cat:'NETWORK',glyph:'○'},
        {id:6,name:'Avahi Zeroconf Browser',cmd:'avahi-discover',cat:'NETWORK',glyph:'○'},
        {id:7,name:'Brave',cmd:'brave-browser',cat:'NETWORK',glyph:'○'},
        {id:8,name:'btop++',cmd:'btop',cat:'SYSTEM',glyph:'▲'},
        {id:9,name:'Calculator',cmd:'gnome-calculator',cat:'OFFICE',glyph:'≡'},
        {id:10,name:'ChatGPT',cmd:'chatgpt',cat:'NETWORK',glyph:'⌥'}
      ];
      const categories = ['ALL','DEVELOP','SYSTEM','NETWORK','OFFICE','GRAPHICS','GAMES','OTHER'];
      const state = {look:'etched',selected:5,query:'',category:'ALL',grid:11,font:'design',commands:'design'};
      const list = root.querySelector('.sl-list');
      const status = root.querySelector('.sl-result-info');
      const number = id => String(id).padStart(2,'0');
      const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const filteredApps = () => apps.filter(app => (state.category === 'ALL' || app.cat === state.category) && `${app.name} ${app.cmd}`.toLowerCase().includes(state.query.toLowerCase()));
      const countFor = category => category === 'ALL' ? apps.length : apps.filter(app => app.cat === category).length;
      root.querySelector('.sl-categories').innerHTML = categories.map(category => `<button type="button" class="sl-category" data-category="${category}" aria-pressed="${category === 'ALL'}" ${countFor(category) === 0 ? 'disabled' : ''}><span>${category}</span><span class="sl-category-count">${number(countFor(category))}</span></button>`).join('') + '<div class="sl-cat-note">APPLICATIONS<div class="sl-cat-rule" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>';
      root.querySelector('#sl-category-picker').innerHTML = categories.map(category => `<option value="${category}" ${countFor(category) === 0 ? 'disabled' : ''}>${category}</option>`).join('');
      function showSelected(message, announce = true) {
        list.querySelectorAll('[data-app]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.app) === state.selected)));
        const selected = apps.find(app => app.id === state.selected);
        status.textContent = message || (selected ? `${number(selected.id)} // ${selected.cmd}` : 'No matching applications');
        if (announce) root.querySelector('.sl-announcement').textContent = message || (selected ? `${selected.name} selected` : 'No matching applications');
        updateCommands();
      }
      function updateCommands() {
        list.querySelectorAll('[data-app]').forEach(button => {
          const command = button.querySelector('.sl-command');
          command.style.display = state.commands === 'all' ? 'block' : state.commands === 'selected' ? (Number(button.dataset.app) === state.selected ? 'block' : 'none') : '';
        });
      }
      function renderApps() {
        const shown = filteredApps();
        if (!shown.some(app => app.id === state.selected)) state.selected = shown[0]?.id ?? null;
        list.innerHTML = shown.length ? shown.map(app => `<button type="button" class="sl-app" data-app="${app.id}" aria-pressed="${app.id === state.selected}" aria-label="Launch ${escape(app.name)}" style="--sl-offset-x:${[0,-4,-2,-6,0,-3,-1,-5][app.id%8]}px;--sl-offset-y:${[0,-2,1,2,-1,0,-2,1][app.id%8]}px"><span class="sl-number">${number(app.id)}</span><span class="sl-glyph" aria-hidden="true">${app.glyph}</span><span class="sl-copy"><span class="sl-name">${escape(app.name)}</span><span class="sl-command">${escape(app.cmd)}</span></span><span class="sl-app-category">${app.cat}</span><span class="sl-diamond" aria-hidden="true"></span></button>`).join('') : '<p class="sl-no-results">No matching applications.</p>';
        root.querySelector('.sl-search-count').textContent = number(shown.length);
        root.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
        root.querySelector('#sl-category-picker').value = state.category;
        showSelected();
      }
      function changeLook() {
        root.dataset.look = state.look;
        root.querySelectorAll('[data-look-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lookChoice === state.look)));
        root.style.setProperty('--sl-grid', `rgba(204,21,21,${state.grid/100})`);
        const fonts = {sans:'var(--sl-sans)',mono:'var(--sl-mono)',grotesk:'var(--sl-grotesk)'};
        if (state.font === 'design') root.style.removeProperty('--sl-type');
        else root.style.setProperty('--sl-type', fonts[state.font]);
        updateCommands();
      }
      function launchPreview(id) {
        state.selected = id;
        showSelected(`PREVIEW // Would launch ${apps.find(app => app.id === id).name}`);
      }
      root.addEventListener('click', event => {
        const designButton = event.target.closest('[data-look-choice]');
        if (designButton) { state.look = designButton.dataset.lookChoice; changeLook(); return; }
        const category = event.target.closest('[data-category]');
        if (category) { state.category = category.dataset.category; renderApps(); return; }
        const app = event.target.closest('[data-app]');
        if (app) { launchPreview(Number(app.dataset.app)); return; }
        const footer = event.target.closest('[data-footer]');
        if (footer) showSelected(`PREVIEW // ${footer.dataset.footer} was not executed`);
      });
      list.addEventListener('pointerover', event => {
        if (event.pointerType !== 'mouse') return;
        const app = event.target.closest('[data-app]');
        if (!app || state.selected === Number(app.dataset.app)) return;
        state.selected = Number(app.dataset.app);
        showSelected(undefined, false);
      });
      root.querySelector('#sl-search-input').addEventListener('input', event => { state.query = event.target.value; renderApps(); });
      root.querySelector('#sl-category-picker').addEventListener('change', event => { state.category = event.target.value; renderApps(); });
      root.querySelector('.sl-content').addEventListener('keydown', event => {
        const shown = filteredApps();
        if (!shown.length || event.target.matches('select')) return;
        if (event.key === 'Enter' && event.target.matches('input')) { event.preventDefault(); launchPreview(state.selected); return; }
        if (!['ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const current = shown.findIndex(app => app.id === state.selected);
        state.selected = shown[(current + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length].id;
        showSelected();
        if (event.target.closest('[data-app]')) list.querySelector(`[data-app="${state.selected}"]`).focus({preventScroll:true});
      });
      renderApps();
      changeLook();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root.querySelector('.sl-window'),onChange:changeLook});
        tweak.addSelect(state,'font',{label:'App typography',options:[{label:'Design default',value:'design'},{label:'IBM Plex Sans',value:'sans'},{label:'Space Grotesk',value:'grotesk'},{label:'JetBrains Mono',value:'mono'}]});
        tweak.addSelect(state,'commands',{label:'Command labels',options:[{label:'Design default',value:'design'},{label:'Selected app only',value:'selected'},{label:'Every app',value:'all'}]});
        tweak.addSlider(state,'grid',{label:'Grid strength',min:6,max:18,step:1,unit:'%'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-look-choice=\"etched\"]"}], "remove": ["button[data-look-choice]"], "controls": false});
