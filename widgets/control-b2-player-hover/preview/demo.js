
    (() => {
      const root = document.getElementById('ts-b2-player-hover');
      const el = selector => root.querySelector(selector);
      const state = {view:'overview',highlight:'connection',connection:'wifi',wifi:true,bt:true,network:null,device:'Headphones',output:'Speakers',volume:64,brightness:72,muted:false,dnd:false,notices:[{id:1,app:'FILES',time:'2 MIN AGO',title:'Transfer complete'},{id:2,app:'TERMINAL',time:'8 MIN AGO',title:'Build finished'}]};
      const design = {rowHeight:38,rowGap:8};
      const networks = [{name:'GNXS-2.4G-598048',signal:3},{name:'GNXS-5G-598048',signal:3},{name:'MADHU KIRAN',signal:1},{name:'MADHUKIRAN',signal:1},{name:'ACT-AI_102785161986',signal:1},{name:'VINAY',signal:1},{name:'102677678966',signal:1}];
      const devices = [{name:'Headphones',type:'AUDIO'},{name:'Mouse',type:'INPUT'}];
      const labels = {connection:['01','Connection'],share:['02','Quickshare'],notifications:['03','Notifications'],audio:['04','Audio / Display']};
      const corners = ['tl','tr','bl','br'].map(c => '<i class="bc-corner ' + c + '" aria-hidden="true"></i>').join('');
      const gate = '<span class="bc-glyph"><i class="bc-gate g1"></i><i class="bc-gate g2"></i><i class="bc-gate g3"></i><i class="bc-gate g4"></i><span class="bc-core"><i data-lucide="arrow-right" aria-hidden="true"></i></span></span>';
      root.querySelectorAll('.bc-arrow').forEach(arrow => arrow.innerHTML = gate);
      root.querySelectorAll('.bc-detail').forEach(panel => panel.insertAdjacentHTML('beforeend',corners));
      function icons() { if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}}); }
      function feedback(message) { el('.bc-feedback').textContent = 'Preview // ' + message; }
      function pair(label,value) { return '<span class="bc-pair"><span>' + label + '</span><span class="bc-value">' + value + '</span></span>'; }
      function summary(name) {
        if (name === 'connection') return [state.wifi ? (state.network || 'Wi-Fi enabled') : 'Wi-Fi disabled',pair('WI-FI',state.wifi ? 'ON' : 'OFF') + pair('BT',state.bt ? 'ON' : 'OFF')];
        if (name === 'audio') return [state.output,pair('VOL',state.muted ? 'MUTE' : state.volume + '%') + pair('BRT',state.brightness + '%')];
        if (name === 'notifications') return [state.notices.length + ' notifications','<span>HISTORY</span>' + pair('DND',state.dnd ? 'ON' : 'OFF')];
        return ['Send / receive','<span class="bc-value">READY</span><span>LOCAL</span>'];
      }
      function drawSlots() {
        root.querySelectorAll('.bc-slot').forEach(slot => {
          const name = slot.dataset.node;
          const data = summary(name), label = labels[name];
          if (!slot.firstElementChild) slot.innerHTML = '<span class="bc-head"><span class="bc-index">' + label[0] + '</span><span class="bc-head-label">' + label[1] + '</span></span><span class="bc-slot-value"></span><span class="bc-slot-status"></span><span class="bc-side" aria-hidden="true"></span>' + corners + '<span class="bc-focus" aria-hidden="true"></span>';
          slot.querySelector('.bc-slot-value').textContent = data[0];
          slot.querySelector('.bc-slot-status').innerHTML = data[1];
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
        const captions = {overview:'B2 · outlined controls',audio:'Audio / Display',connection:'Connections',notifications:'Notifications',share:'Quickshare'};
        el('.bc-caption').textContent = captions[view];
        el('.bc-feedback').textContent = 'Preview only · no system changes';
      }
      function actionMarkup(key,label) { return '<button class="bc-action" type="button" data-toggle="' + key + '"><i class="bc-diamond" aria-hidden="true"></i><span>' + label + '</span></button>'; }
      function statusMarkup(message,enabled=true) { return '<div class="bc-status"><i class="bc-status-dot' + (enabled ? '' : ' bc-off') + '" aria-hidden="true"></i><span class="bc-status-text">' + message + '</span></div>'; }
      function drawConnection() {
        const wifi = state.connection === 'wifi', key = wifi ? 'wifi' : 'bt', enabled = state[key];
        const heading = wifi ? 'WI-FI' : 'BLUETOOTH';
        const current = wifi ? state.network : state.device;
        const hint = enabled ? (current ? 'Connected · ' + current : 'Enabled · Scanning') : 'Disabled';
        const container = el('[data-connection-content]');
        if (!container.firstElementChild) {
          container.innerHTML = statusMarkup(hint,enabled) + actionMarkup(key,'') + '<div class="bc-list"></div>';
          container.querySelector('[data-toggle]').addEventListener('click',() => {
            const selectedKey = state.connection === 'wifi' ? 'wifi' : 'bt';
            state[selectedKey] = !state[selectedKey];
            if (!state[selectedKey]) { if (selectedKey === 'wifi') state.network = null; else state.device = null; }
            drawConnection(); drawSlots();
            feedback((selectedKey === 'wifi' ? 'WI-FI' : 'BLUETOOTH') + (state[selectedKey] ? ' enabled' : ' disabled'));
          });
        }
        container.querySelector('.bc-status-text').textContent = hint;
        container.querySelector('.bc-status-dot').classList.toggle('bc-off',!enabled);
        const toggle = container.querySelector('[data-toggle]');
        toggle.dataset.toggle = key;
        toggle.querySelector('span').textContent = (enabled ? 'DISABLE ' : 'ENABLE ') + heading;
        root.querySelectorAll('[data-connection]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.connection === state.connection)));
        const list = container.querySelector('.bc-list');
        list.setAttribute('aria-label',wifi ? 'Sample wireless networks' : 'Sample Bluetooth devices');
        const layout = key + ':' + enabled;
        if (list.dataset.layout !== layout) {
          list.dataset.layout = layout;
          list.replaceChildren();
          if (!enabled) list.innerHTML = '<div class="bc-empty">' + heading + ' is off</div>';
          else {
          const items = wifi ? networks : devices;
          for (const item of items) {
            const row = document.createElement('button'); row.type = 'button'; row.className = 'bc-row'; row.dataset.device = item.name;
            row.setAttribute('aria-description',wifi ? 'Secured network. Signal ' + item.signal + ' of 3.' : item.type + ' device.');
            const signal = wifi ? '<span class="bc-strength">' + Array.from({length:3},(_,i) => '<i' + (i >= item.signal ? ' class="bc-dim"' : '') + '></i>').join('') + '</span><i data-lucide="lock-keyhole"></i>' : '<span class="bc-row-meta">' + item.type + '</span>';
            row.innerHTML = '<span class="bc-row-name">' + item.name + '</span><span class="bc-row-indicators" aria-hidden="true">' + signal + '</span>';
            row.addEventListener('click',() => { if (wifi) state.network = item.name; else state.device = item.name; drawConnection(); drawSlots(); feedback(item.name + ' selected'); });
            list.append(row);
          }
          }
          icons();
        }
        list.querySelectorAll('.bc-row').forEach(row => {
          const active = current === row.dataset.device;
          row.setAttribute('aria-pressed',String(active));
          row.setAttribute('aria-label',row.dataset.device + (active ? ', connected' : ', select in preview'));
        });
      }
      function drawAudio() {
        for (const key of ['volume','brightness']) {
          const section = el('[data-channel="' + key + '"]'); const input = section.querySelector('input');
          input.value = state[key]; section.querySelector('output').textContent = state[key] + '%'; section.querySelector('.bc-track').style.setProperty('--bc-percent',state[key] + '%');
        }
        el('[data-channel="volume"]').classList.toggle('bc-muted',state.muted);
        el('[data-mute] span').textContent = state.muted ? 'UNMUTE AUDIO' : 'MUTE AUDIO';
        el('[data-audio-status]').textContent = (state.muted ? 'Muted' : 'Active') + ' · ' + state.output;
        const list = el('[data-output-list]');
        if (!list.firstElementChild) for (const name of ['Speakers','Headphones','HDMI output']) {
          const row = document.createElement('button'); row.type = 'button'; row.className = 'bc-row'; row.dataset.output = name;
          row.setAttribute('aria-label',name.endsWith('output') ? name : name + ' output'); row.textContent = name.toUpperCase();
          row.addEventListener('click',() => { state.output = name; drawAudio(); feedback(name + ' output selected'); });
          list.append(row);
        }
        list.querySelectorAll('.bc-row').forEach(row => row.setAttribute('aria-pressed',String(row.dataset.output === state.output)));
        drawSlots();
      }
      function drawNotifications() {
        const container = el('[data-notification-content]');
        if (!container.firstElementChild) {
          container.innerHTML = '<h2 class="bc-section-title">HISTORY</h2>' + statusMarkup('') + actionMarkup('dnd','') + '<div class="bc-list" aria-label="Sample notifications"></div><div class="bc-history-foot"><button class="bc-action bc-secondary" data-clear type="button"><i class="bc-diamond" aria-hidden="true"></i><span>CLEAR HISTORY</span></button></div>';
          container.querySelector('[data-clear]').addEventListener('click',() => { state.notices = []; drawNotifications(); drawSlots(); container.querySelector('[data-toggle="dnd"]').focus({preventScroll:true}); feedback('sample history cleared'); });
          container.querySelector('[data-toggle="dnd"]').addEventListener('click',() => { state.dnd = !state.dnd; drawNotifications(); drawSlots(); feedback('Do not disturb ' + (state.dnd ? 'enabled' : 'disabled')); });
        }
        container.querySelector('.bc-status-text').textContent = (state.dnd ? 'Banners paused' : 'Banners enabled') + ' · ' + state.notices.length + ' saved';
        container.querySelector('.bc-status-dot').classList.toggle('bc-off',state.dnd);
        container.querySelector('[data-toggle="dnd"] span').textContent = (state.dnd ? 'DISABLE' : 'ENABLE') + ' DO NOT DISTURB';
        container.querySelector('[data-clear]').disabled = !state.notices.length;
        const list = container.querySelector('.bc-list');
        const noticeIds = state.notices.map(notice => notice.id).join(',');
        if (list.dataset.noticeIds === noticeIds) return;
        list.dataset.noticeIds = noticeIds;
        list.replaceChildren();
        if (!state.notices.length) list.innerHTML = '<div class="bc-empty">No saved notifications</div>';
        for (const notice of state.notices) {
          const row = document.createElement('div'); row.className = 'bc-notice';
          row.innerHTML = '<div><div class="bc-notice-meta"><span>' + notice.app + '</span><span>' + notice.time + '</span></div><div class="bc-notice-title">' + notice.title + '</div></div><button class="bc-dismiss" type="button" aria-label="Dismiss ' + notice.title + '"><i data-lucide="x" aria-hidden="true"></i></button>';
          row.querySelector('button').addEventListener('click',() => { state.notices = state.notices.filter(item => item.id !== notice.id); drawNotifications(); drawSlots(); (container.querySelector('.bc-dismiss') || container.querySelector('[data-toggle="dnd"]')).focus({preventScroll:true}); feedback('notification dismissed'); }); list.append(row);
        }
        icons();
      }
      root.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click',() => show(button.dataset.route)));
      root.querySelectorAll('[data-go-back]').forEach(button => button.addEventListener('click',() => { const previous = state.view; show('overview'); el('.bc-slot[data-node="' + previous + '"]').focus({preventScroll:true}); }));
      root.querySelectorAll('.bc-cross .bc-slot').forEach(slot => {
        slot.addEventListener('pointerenter',() => focusNode(slot.dataset.node)); slot.addEventListener('focus',() => focusNode(slot.dataset.node));
        slot.addEventListener('click',() => { show(slot.dataset.node); el('[data-panel="' + state.view + '"] .bc-close').focus({preventScroll:true}); });
      });
      root.querySelectorAll('[data-connection]').forEach(button => button.addEventListener('click',() => { state.connection = button.dataset.connection; drawConnection(); }));
      root.querySelectorAll('.bc-range').forEach(input => input.addEventListener('input',() => { const key = input.closest('[data-channel]').dataset.channel; state[key] = Number(input.value); if (key === 'volume') state.muted = false; drawAudio(); }));
      el('[data-mute]').addEventListener('click',() => { state.muted = !state.muted; drawAudio(); feedback(state.muted ? 'audio muted' : 'audio unmuted'); });
      root.querySelectorAll('[data-share-action]').forEach(button => button.addEventListener('click',() => {
        el('[data-share-status]').textContent = button.dataset.shareAction === 'send' ? 'Send action selected · Preview' : 'Receive action selected · Preview';
        feedback('Quickshare action previewed · no files transferred');
      }));
      function renderDesign() { root.style.setProperty('--bc-row-height',design.rowHeight + 'px'); root.style.setProperty('--bc-row-gap',design.rowGap + 'px'); }
      new ResizeObserver(() => focusNode(state.highlight)).observe(root);
      drawConnection(); drawNotifications(); drawAudio(); focusNode(state.highlight); show(state.view); renderDesign(); icons();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:renderDesign});
        tweak.addSlider(design,'rowHeight',{label:'Control row height',min:34,max:44,step:2,unit:'px'});
        tweak.addSlider(design,'rowGap',{label:'Space between rows',min:6,max:12,step:1,unit:'px'});
      }
    })();


window.XLR8Archive.finish({"controls": false});
