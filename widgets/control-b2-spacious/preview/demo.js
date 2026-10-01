
    (() => {
      const root = document.getElementById('ts-b2-spacious');
      const el = selector => root.querySelector(selector);
      const state = {view:'overview',highlight:'connection',connection:'wifi',wifi:true,bt:false,network:'Home network',device:'Headphones',output:'Speakers',volume:64,brightness:72,muted:false,dnd:false,notices:[{id:1,app:'FILES',icon:'folder',time:'2 MIN AGO',title:'Transfer complete'},{id:2,app:'TERMINAL',icon:'terminal',time:'8 MIN AGO',title:'Build finished'}]};
      const design = {selection:'edge',rowHeight:68,panelWidth:520};
      const labels = {connection:['01','Connection'],share:['02','Quickshare'],notifications:['03','Notifications'],audio:['04','Audio / Display']};
      const corners = ['tl','tr','bl','br'].map(c => '<i class="bc-corner ' + c + '" aria-hidden="true"></i>').join('');
      const gate = '<span class="bc-glyph"><i class="bc-gate g1"></i><i class="bc-gate g2"></i><i class="bc-gate g3"></i><i class="bc-gate g4"></i><span class="bc-core"><i data-lucide="arrow-right" aria-hidden="true"></i></span></span>';
      root.querySelectorAll('.bc-arrow').forEach(arrow => arrow.innerHTML = gate);
      root.querySelectorAll('.bc-detail').forEach(panel => panel.insertAdjacentHTML('beforeend',corners));
      function icons() { if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}}); }
      function feedback(message) { el('.bc-feedback').textContent = 'Preview // ' + message; }
      function pair(label,value) { return '<span class="bc-pair"><span>' + label + '</span><span class="bc-value">' + value + '</span></span>'; }
      function summary(name) {
        if (name === 'connection') return [state.wifi ? state.network : 'Wi-Fi disabled',pair('WI-FI',state.wifi ? 'ON' : 'OFF') + pair('BT',state.bt ? 'ON' : 'OFF')];
        if (name === 'audio') return [state.output,pair('VOL',state.muted ? 'MUTE' : state.volume + '%') + pair('BRT',state.brightness + '%')];
        if (name === 'notifications') return [state.notices.length + ' notifications','<span>HISTORY</span>' + pair('DND',state.dnd ? 'ON' : 'OFF')];
        return ['Send / receive','<span class="bc-value">READY</span><span>LOCAL</span>'];
      }
      function drawSlots() {
        root.querySelectorAll('.bc-slot').forEach(slot => {
          const name = slot.dataset.node;
          const data = summary(name), label = labels[name];
          slot.innerHTML = '<span class="bc-head"><span class="bc-index">' + label[0] + '</span><span class="bc-head-label">' + label[1] + '</span></span><span class="bc-slot-value">' + data[0] + '</span><span class="bc-slot-status">' + data[1] + '</span><span class="bc-side" aria-hidden="true"></span>' + corners + '<span class="bc-focus" aria-hidden="true"></span>';
        });
      }
      function focusNode(name) {
        state.highlight = name;
        root.querySelectorAll('.bc-cross .bc-slot').forEach(slot => { const active = slot.dataset.node === name; slot.classList.toggle('bc-selected',active); slot.setAttribute('aria-pressed',String(active)); });
        const compact = root.getBoundingClientRect().width <= 620;
        const rest = {connection:-90,share:180,notifications:0,audio:90};
        const focus = {connection:90,share:0,notifications:180,audio:-90};
        root.querySelectorAll('.bc-cross .bc-arrow').forEach(arrow => { const active = arrow.dataset.axis === name; arrow.classList.toggle('bc-active',active); arrow.style.setProperty('--bc-angle',(compact ? (active ? 180 : 0) : (active ? focus[arrow.dataset.axis] : rest[arrow.dataset.axis])) + 'deg'); });
      }
      function show(view) {
        state.view = view;
        el('.bc-cross').hidden = view !== 'overview'; el('.bc-details').hidden = view === 'overview';
        root.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== view);
        root.querySelectorAll('.bc-route').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.route === view)));
        if (view !== 'overview') focusNode(view);
        drawSlots();
        const captions = {overview:'B2 · spacious layout',audio:'Audio / Display',connection:'Connections',notifications:'Notifications'};
        el('.bc-caption').textContent = captions[view];
        el('.bc-feedback').textContent = 'Preview only · no system changes';
      }
      function switchMarkup(key,label) { return '<button class="bc-switch" type="button" role="switch" data-switch="' + key + '" aria-label="' + label + '" aria-checked="' + state[key] + '"><span class="bc-switch-text">' + (state[key] ? 'ON' : 'OFF') + '</span><span class="bc-switch-thumb" aria-hidden="true"></span></button>'; }
      function bindSwitch(container) {
        container.querySelectorAll('[data-switch]').forEach(button => button.addEventListener('click',() => {
          const key = button.dataset.switch;
          state[key] = !state[key];
          if (key === 'dnd') drawNotifications(); else drawConnection();
          container.querySelector('[data-switch="' + key + '"]').focus({preventScroll:true});
          drawSlots(); feedback(button.getAttribute('aria-label') + ' ' + (state[key] ? 'on' : 'off'));
        }));
      }
      function drawConnection() {
        const wifi = state.connection === 'wifi', key = wifi ? 'wifi' : 'bt', enabled = state[key];
        const heading = wifi ? 'Wi-Fi' : 'Bluetooth';
        const hint = enabled ? (wifi ? state.network : state.device) : 'Disabled';
        const container = el('[data-connection-content]');
        container.innerHTML = '<div class="bc-switch-line"><div><div class="bc-setting-name">' + heading + '</div><div class="bc-hint">' + hint + '</div></div>' + switchMarkup(key,heading) + '</div><div class="bc-list-label"><span>' + (wifi ? 'NETWORKS' : 'DEVICES') + '</span><span>' + (enabled ? (wifi ? '3 AVAILABLE' : '2 PAIRED') : 'OFF') + '</span></div><div class="bc-device-list"></div>';
        root.querySelectorAll('[data-connection]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.connection === state.connection)));
        const list = container.querySelector('.bc-device-list');
        if (!enabled) list.innerHTML = '<div class="bc-empty">' + heading + ' is off</div>';
        else {
          const items = wifi ? [{name:'Home network',signal:4},{name:'Studio',signal:3},{name:'Guest',signal:2}] : [{name:'Headphones',signal:0},{name:'Mouse',signal:0}];
          for (const item of items) {
            const active = (wifi ? state.network : state.device) === item.name;
            const signal = wifi ? '<span class="bc-signal" aria-hidden="true">' + Array.from({length:4},(_,i) => '<i' + (i >= item.signal ? ' class="bc-dim"' : '') + '></i>').join('') + '</span>' : '<span></span>';
            const row = document.createElement('button'); row.type = 'button'; row.className = 'bc-device'; row.dataset.device = item.name; row.setAttribute('aria-pressed',String(active)); row.setAttribute('aria-label',item.name + (active ? ', connected' : ', connect in preview'));
            row.innerHTML = '<span><span class="bc-device-name">' + item.name + '</span><span class="bc-device-state">' + (active ? 'Connected' : (wifi ? 'Available' : 'Paired')) + '</span></span>' + signal + '<i data-lucide="' + (wifi ? 'lock-keyhole' : 'bluetooth') + '" aria-hidden="true"></i>';
            row.addEventListener('click',() => { if (wifi) state.network = item.name; else state.device = item.name; drawConnection(); drawSlots(); Array.from(container.querySelectorAll('.bc-device')).find(button => button.dataset.device === item.name)?.focus({preventScroll:true}); feedback(item.name + ' selected'); });
            list.append(row);
          }
        }
        bindSwitch(container); icons();
      }
      function drawAudio() {
        for (const key of ['volume','brightness']) {
          const section = el('[data-channel="' + key + '"]'); const input = section.querySelector('input');
          input.value = state[key]; section.querySelector('output').textContent = state[key] + '%'; section.querySelector('.bc-track').style.setProperty('--bc-percent',state[key] + '%');
        }
        el('[data-channel="volume"]').classList.toggle('bc-muted',state.muted);
        el('[data-mute]').setAttribute('aria-pressed',String(state.muted));
        el('[data-output-status]').hidden = !state.muted;
        drawSlots();
      }
      function drawNotifications() {
        const container = el('[data-notification-content]');
        container.innerHTML = '<div class="bc-switch-line"><div><div class="bc-setting-name">DO NOT DISTURB</div><div class="bc-hint">' + (state.dnd ? 'Banners paused' : 'Banners enabled') + '</div></div>' + switchMarkup('dnd','Do not disturb') + '</div><div class="bc-notice-list"></div><div class="bc-history-foot"><span>' + state.notices.length + ' SAVED</span><button class="bc-clear" type="button"' + (state.notices.length ? '' : ' disabled') + '>CLEAR HISTORY</button></div>';
        const list = container.querySelector('.bc-notice-list');
        if (!state.notices.length) list.innerHTML = '<div class="bc-empty">No saved notifications</div>';
        for (const notice of state.notices) {
          const row = document.createElement('div'); row.className = 'bc-notice';
          row.innerHTML = '<span class="bc-notice-app"><i data-lucide="' + notice.icon + '" aria-hidden="true"></i></span><div><div class="bc-notice-meta"><span>' + notice.app + '</span><span>' + notice.time + '</span></div><div class="bc-notice-title">' + notice.title + '</div></div><button class="bc-icon-button bc-dismiss" type="button" aria-label="Dismiss ' + notice.title + '"><i data-lucide="x" aria-hidden="true"></i></button>';
          row.querySelector('button').addEventListener('click',() => { state.notices = state.notices.filter(item => item.id !== notice.id); drawNotifications(); drawSlots(); (container.querySelector('.bc-dismiss') || container.querySelector('[data-switch="dnd"]')).focus({preventScroll:true}); feedback('notification dismissed'); }); list.append(row);
        }
        container.querySelector('.bc-clear').addEventListener('click',() => { state.notices = []; drawNotifications(); drawSlots(); container.querySelector('[data-switch="dnd"]').focus({preventScroll:true}); feedback('sample history cleared'); });
        bindSwitch(container); icons();
      }
      root.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click',() => show(button.dataset.route)));
      root.querySelectorAll('[data-go-back]').forEach(button => button.addEventListener('click',() => show('overview')));
      root.querySelectorAll('.bc-cross .bc-slot').forEach(slot => {
        slot.addEventListener('pointerenter',() => focusNode(slot.dataset.node)); slot.addEventListener('focus',() => focusNode(slot.dataset.node));
        slot.addEventListener('click',() => { if (slot.dataset.node !== 'share') show(slot.dataset.node); else feedback('Quickshare unchanged in this preview'); });
      });
      root.querySelectorAll('[data-connection]').forEach(button => button.addEventListener('click',() => { state.connection = button.dataset.connection; drawConnection(); }));
      el('#b2-spacious-output').addEventListener('change',event => { state.output = event.target.value; drawAudio(); feedback('output set to ' + state.output); });
      root.querySelectorAll('.bc-range').forEach(input => input.addEventListener('input',() => { const key = input.closest('[data-channel]').dataset.channel; state[key] = Number(input.value); if (key === 'volume') state.muted = false; drawAudio(); }));
      el('[data-mute]').addEventListener('click',() => { state.muted = !state.muted; drawAudio(); feedback(state.muted ? 'audio muted' : 'audio unmuted'); });
      function renderDesign() { root.dataset.selection = design.selection; root.style.setProperty('--bc-row-height',design.rowHeight + 'px'); root.style.setProperty('--bc-panel-width',design.panelWidth + 'px'); }
      new ResizeObserver(() => focusNode(state.highlight)).observe(root);
      drawConnection(); drawNotifications(); drawAudio(); focusNode(state.highlight); show(state.view); renderDesign(); icons();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:renderDesign});
        tweak.addSelect(design,'selection',{label:'Connected row treatment',options:[{label:'Red fill',value:'filled'},{label:'Red edge',value:'edge'}]});
        tweak.addSlider(design,'rowHeight',{label:'Device row height',min:60,max:76,step:2,unit:'px'});
        tweak.addSlider(design,'panelWidth',{label:'Detail panel width',min:460,max:560,step:10,unit:'px'});
      }
    })();


window.XLR8Archive.finish({"controls": false});
