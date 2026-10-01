
    (() => {
      const root = document.getElementById('ts-menu-details');
      const el = selector => root.querySelector(selector);
      const search = el('input');
      const list = el('.md-apps');
      const status = el('.md-status');
      const apps = [
        {name:'Alacritty',group:'system',command:'alacritty',glyph:'▸'},
        {name:'Brave',group:'network',command:'brave-browser',glyph:'○'},
        {name:'btop++',group:'system',command:'btop',glyph:'▲'},
        {name:'GIMP',group:'graphics',command:'gimp',glyph:'◇'},
        {name:'LibreOffice Writer',group:'office',command:'libreoffice --writer',glyph:'≡'},
        {name:'mpv',group:'media',command:'mpv',glyph:'▸'},
        {name:'Steam',group:'games',command:'steam',glyph:'⊕'},
        {name:'VSCodium',group:'develop',command:'codium',glyph:'⌥'}
      ];
      const groups = ['all','develop','system','network','media','office','graphics','games','other'];
      let group = 'all';
      let selected = 'btop++';
      let shown = apps;
      let busy = false;
      let closed = false;
      const settings = {grid:9,row:48};
      const pad = number => String(number).padStart(2,'0');
      const categoryButtons = [];
      for (const name of groups) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'md-category';
        button.dataset.group = name;
        const count = name === 'all' ? apps.length : apps.filter(app => app.group === name).length;
        button.innerHTML = '<span>' + name.toUpperCase() + '</span><span class="md-count">' + pad(count) + '</span>';
        button.setAttribute('aria-label',name.toUpperCase() + ', ' + count + ' applications');
        button.addEventListener('click',() => { group = name; renderList(); });
        categoryButtons.push(button);
        el('.md-categories').append(button);
      }
      function updateSelection() {
        list.querySelectorAll('.md-app').forEach(button => {
          const active = button.dataset.name === selected;
          button.classList.toggle('md-selected',active);
          button.setAttribute('aria-pressed',String(active));
        });
      }
      function renderList() {
        const value = search.value.toLowerCase().trim();
        shown = apps.filter(app => (group === 'all' || group === app.group) && (app.name + ' ' + app.command).toLowerCase().includes(value));
        if (!shown.some(app => app.name === selected)) selected = shown[0]?.name || '';
        list.replaceChildren();
        for (const app of shown) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'md-app';
          button.dataset.name = app.name;
          button.setAttribute('aria-label','Select ' + app.name);
          button.innerHTML = '<span class="md-number">' + pad(apps.indexOf(app) + 1) + '</span><span class="md-glyph" aria-hidden="true">' + app.glyph + '</span><span class="md-info"><span class="md-app-name">' + app.name + '</span><span class="md-command">' + app.command + '</span></span><span class="md-row-mark" aria-hidden="true"></span>';
          button.addEventListener('click',() => { selected = app.name; updateSelection(); status.textContent = 'SELECTED // ' + app.name; });
          list.append(button);
        }
        if (!shown.length) {
          const empty = document.createElement('p');
          empty.className = 'md-empty'; empty.textContent = 'NO APPLICATIONS FOUND'; list.append(empty);
        }
        categoryButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.group === group)));
        el('.md-node-count').textContent = pad(shown.length) + ' / ' + pad(apps.length) + ' APPS';
        status.textContent = value ? pad(shown.length) + ' MATCHES' : group.toUpperCase() + ' APPLICATIONS';
        updateSelection();
      }
      function style() {
        root.style.setProperty('--md-grid','rgba(204,21,21,' + settings.grid / 100 + ')');
        root.style.setProperty('--md-row',settings.row + 'px');
      }
      root.querySelectorAll('[data-choice]').forEach(button => {
        button.addEventListener('click',() => {
          root.dataset.design = button.dataset.choice;
          root.querySelectorAll('[data-choice]').forEach(other => other.setAttribute('aria-pressed',String(other === button)));
        });
      });
      search.addEventListener('input',renderList);
      el('.md-menu').addEventListener('keydown',event => {
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && shown.length) {
          event.preventDefault();
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          const index = shown.findIndex(app => app.name === selected);
          selected = shown[(index + delta + shown.length) % shown.length].name;
          updateSelection();
          status.textContent = 'SELECTED // ' + selected;
        } else if (event.key === 'Enter' && event.target === search && selected) {
          event.preventDefault(); status.textContent = 'PREVIEW ONLY // ' + selected;
        } else if (event.key === 'Escape') { event.preventDefault(); void closeMenu(); }
      });
      root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click',() => {
        status.textContent = 'PREVIEW ONLY // ' + button.dataset.action.toUpperCase();
      }));
      const assembly = el('.md-assembly');
      const curtain = el('.md-curtain');
      const replay = el('.md-replay');
      const menu = el('.md-menu');
      const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      async function motion(target,frames,options) {
        const animation = target.animate(frames,{...options,fill:'forwards'});
        await animation.finished;
        Object.assign(target.style,frames[frames.length - 1]);
        animation.cancel();
      }
      async function closeMenu() {
        if (busy || closed) return;
        busy = true; replay.disabled = true;
        menu.inert = true;
        if (reduce()) { curtain.style.width = '100%'; assembly.style.transform = 'translateX(100%)'; }
        else await Promise.all([
          motion(curtain,[{width:'0%'},{width:'100%'}],{duration:420,easing:'cubic-bezier(.76,0,.24,1)'}),
          motion(assembly,[{transform:'translateX(0%)'},{transform:'translateX(100%)'}],{duration:510,delay:270,easing:'cubic-bezier(.76,0,.24,1)'})
        ]);
        busy = false; closed = true; replay.disabled = false; replay.textContent = 'Open Menu'; replay.focus();
      }
      async function openMenu() {
        if (busy || !closed) return;
        busy = true; replay.disabled = true;
        if (reduce()) { assembly.style.transform = 'translateX(0%)'; curtain.style.width = '0%'; }
        else {
          await motion(assembly,[{transform:'translateX(100%)'},{transform:'translateX(0%)'}],{duration:440,easing:'cubic-bezier(.16,1,.3,1)'});
          await motion(curtain,[{width:'100%'},{width:'0%'}],{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});
        }
        busy = false; closed = false; replay.disabled = false; menu.inert = false; replay.textContent = 'Replay curtain';
      }
      replay.addEventListener('click',async () => { if (closed) await openMenu(); else { await closeMenu(); await openMenu(); } });
      style(); renderList();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:menu,onChange:style});
        tweak.addSlider(settings,'grid',{label:'Red grid opacity',min:5,max:16,unit:'%'});
        tweak.addSlider(settings,'row',{label:'App row height',min:46,max:58,unit:'px'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"c\"]"}], "remove": ["button[data-choice]"], "controls": false});
