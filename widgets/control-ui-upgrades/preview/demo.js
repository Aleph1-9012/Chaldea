
    (() => {
      const root = document.getElementById('ts-cc-ui-upgrades');
      const el = selector => root.querySelector(selector);
      const state = {view:'overview',tab:'wifi',focused:'connection',wifi:true,bt:false,dnd:false,network:'Home network',btConnected:false,volume:64,brightness:72,muted:false,output:'Speakers',notices:[{id:1,app:'FILES',time:'2 MIN AGO',title:'Transfer complete'},{id:2,app:'TERMINAL',time:'8 MIN AGO',title:'Build finished'}]};
      const design = {heading:'caps',strip:'divided'};
      const corners = ['tl','tr','bl','br'].map(corner => '<i class="cu-corner ' + corner + '" aria-hidden="true"></i>').join('');
      root.querySelectorAll('.cu-frame:not(.cu-center)').forEach(frame => frame.insertAdjacentHTML('beforeend',corners));
      root.querySelectorAll('.cu-node').forEach(node => node.insertAdjacentHTML('beforeend','<span class="cu-square" aria-hidden="true"></span><span class="cu-side" aria-hidden="true"></span><span class="cu-focus" aria-hidden="true"></span>'));
      function icons() { if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}}); }
      function summaries() {
        const summary = {network:state.wifi ? state.network : 'Wi-Fi disabled',wifi:state.wifi ? 'WI-FI ON' : 'WI-FI OFF',bt:state.bt ? 'BT ON' : 'BT OFF',notices:state.notices.length + ' saved notifications',dnd:state.dnd ? 'DND ON' : 'DND OFF',output:state.output,volume:state.muted ? 'MUTED' : 'VOL ' + state.volume + '%',brightness:'BRT ' + state.brightness + '%'};
        for (const [name,value] of Object.entries(summary)) el('[data-summary="' + name + '"]').textContent = value;
      }
      function focusNode(name) {
        state.focused = name;
        root.querySelectorAll('.cu-node').forEach(node => node.classList.toggle('cu-focused',node.dataset.node === name));
        const rest = {connection:180,share:90,notifications:-90,audio:0};
        const focus = {connection:0,share:-90,notifications:90,audio:180};
        root.querySelectorAll('.cu-arrow').forEach(arrow => {
          const active = arrow.dataset.axis === name;
          arrow.classList.toggle('cu-active',active);
          arrow.style.setProperty('--cu-angle',(active ? focus[arrow.dataset.axis] : rest[arrow.dataset.axis]) + 'deg');
          const ctx = arrow.querySelector('canvas').getContext('2d');
          ctx.clearRect(0,0,72,72); ctx.fillStyle = '#111111'; ctx.strokeStyle = 'rgba(232,232,232,.35)'; ctx.lineWidth = 1.2;
          const points = [[.08,.32],[.18,.22],[.37,.39],[.50,.27],[.63,.39],[.82,.22],[.92,.32],[.68,.51],[.50,.94],[.32,.51]];
          ctx.beginPath(); points.forEach((point,index) => { if (!index) ctx.moveTo(point[0]*72,point[1]*72); else ctx.lineTo(point[0]*72,point[1]*72); }); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
      }
      function switchMarkup(key,label) {
        return '<button type="button" class="cu-switch" role="switch" data-switch="' + key + '" aria-label="' + label + '" aria-checked="' + state[key] + '"><span class="cu-switch-text">' + (state[key] ? 'ON' : 'OFF') + '</span><span class="cu-switch-thumb" aria-hidden="true"></span></button>';
      }
      function bindSwitch(container) {
        container.querySelectorAll('[data-switch]').forEach(button => button.addEventListener('click',() => {
          const key = button.dataset.switch;
          state[key] = !state[key];
          if (key === 'bt' && !state.bt) state.btConnected = false;
          if (key === 'dnd') drawNotifications(); else drawConnection();
          summaries();
          container.querySelector('[data-switch="' + key + '"]').focus();
          el('.cu-feedback').textContent = 'Preview · ' + button.getAttribute('aria-label') + ' ' + (state[key] ? 'on' : 'off');
        }));
      }
      function signalMarkup(strength) { return '<span class="cu-signal" aria-hidden="true">' + [1,2,3,4].map(bar => '<i' + (bar > strength ? ' class="cu-dim"' : '') + '></i>').join('') + '</span>'; }
      function drawConnection() {
        const panel = el('.cu-connection');
        const wifi = state.tab === 'wifi';
        panel.querySelector('.cu-plate').textContent = wifi ? 'Wi-Fi' : 'Bluetooth';
        const enabled = wifi ? state.wifi : state.bt;
        const label = wifi ? 'Wi-Fi' : 'Bluetooth';
        let content = '<div class="cu-switch-row"><div><div class="cu-setting-name">' + label + '</div><div class="cu-setting-hint">' + (enabled ? wifi ? 'Connected to ' + state.network : state.btConnected ? 'Headphones connected' : 'Ready to connect' : 'Disabled') + '</div></div>' + switchMarkup(wifi ? 'wifi' : 'bt',label) + '</div>';
        if (wifi && enabled) {
          content += '<div class="cu-list"><div class="cu-columns" aria-hidden="true"><span>NETWORK</span><span>SIG.</span><span></span><span>STATE</span></div>';
          [{name:'Home network',bars:4,locked:true},{name:'Studio',bars:3,locked:true},{name:'Guest',bars:2,locked:false}].forEach(network => {
            const active = state.network === network.name;
            content += '<button type="button" class="cu-device" data-network="' + network.name + '" aria-pressed="' + active + '" aria-label="' + network.name + ', signal ' + network.bars + ' of 4, ' + (network.locked ? 'secured' : 'open') + (active ? ', connected' : ', select in preview') + '"><span class="cu-device-name">' + network.name + '</span>' + signalMarkup(network.bars) + '<span><i data-lucide="' + (network.locked ? 'lock-keyhole' : 'lock-keyhole-open') + '" aria-hidden="true"></i></span><span class="cu-device-state">' + (active ? 'LINKED' : 'JOIN') + '</span></button>';
          });
          content += '</div><div class="cu-panel-foot"><span>3 NETWORKS</span><span>Wi-Fi enabled</span></div>';
        } else if (!wifi && enabled) {
          content += '<div class="cu-list"><button type="button" class="cu-device" data-headphones aria-pressed="' + state.btConnected + '" aria-label="Headphones, ' + (state.btConnected ? 'connected' : 'pair in preview') + '"><span class="cu-device-name">Headphones</span><span></span><i data-lucide="headphones" aria-hidden="true"></i><span class="cu-device-state">' + (state.btConnected ? 'LINKED' : 'PAIR') + '</span></button></div><div class="cu-panel-foot"><span>1 DEVICE</span><span>Bluetooth enabled</span></div>';
        } else content += '<div class="cu-empty">' + label + ' is off.</div>';
        panel.querySelector('.cu-panel-content').innerHTML = content;
        root.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.tab === state.tab)));
        bindSwitch(panel);
        panel.querySelectorAll('[data-network]').forEach(button => button.addEventListener('click',() => {
          state.network = button.dataset.network; drawConnection(); summaries();
          [...panel.querySelectorAll('[data-network]')].find(other => other.dataset.network === state.network).focus();
          el('.cu-feedback').textContent = 'Preview · ' + state.network + ' selected';
        }));
        const headphones = panel.querySelector('[data-headphones]');
        if (headphones) headphones.addEventListener('click',() => { state.btConnected = !state.btConnected; drawConnection(); panel.querySelector('[data-headphones]').focus(); });
        icons();
      }
      function drawNotifications() {
        const panel = el('.cu-notifications');
        let content = '<div class="cu-switch-row"><div><div class="cu-setting-name">Do Not Disturb</div><div class="cu-setting-hint">' + (state.dnd ? 'Notifications silenced' : 'Notifications enabled') + '</div></div>' + switchMarkup('dnd','Do Not Disturb') + '</div><div class="cu-list">';
        if (!state.notices.length) content += '<div class="cu-empty">No saved notifications</div>';
        state.notices.forEach(notice => { content += '<div class="cu-notice"><div><small>' + notice.app + ' // ' + notice.time + '</small><span>' + notice.title + '</span></div><button class="cu-dismiss" type="button" data-dismiss="' + notice.id + '" aria-label="Dismiss ' + notice.title + '">×</button></div>'; });
        panel.querySelector('.cu-panel-content').innerHTML = content + '</div><div class="cu-panel-foot"><span>' + state.notices.length + ' SAVED</span><span>HISTORY</span></div>';
        bindSwitch(panel);
        panel.querySelectorAll('[data-dismiss]').forEach(button => button.addEventListener('click',() => {
          state.notices = state.notices.filter(notice => notice.id !== Number(button.dataset.dismiss));
          drawNotifications(); summaries(); panel.querySelector('[data-switch]').focus();
          el('.cu-feedback').textContent = 'Sample notification dismissed';
        }));
      }
      function audioValues() {
        ['volume','brightness'].forEach(key => {
          el('#cu-' + key).value = state[key];
          el('output[for="cu-' + key + '"]').textContent = state[key] + '%';
          el('[data-track="' + key + '"]').style.setProperty('--cu-value',(key === 'volume' && state.muted ? 0 : state[key]) + '%');
        });
        el('.cu-mute').textContent = state.muted ? 'UNMUTE' : 'MUTE';
        el('.cu-mute').setAttribute('aria-pressed',String(state.muted));
        el('[data-audio-status]').textContent = state.muted ? 'Muted · ' + state.output : state.output;
        summaries();
      }
      function show(view) {
        state.view = view;
        el('.cu-cross').hidden = view !== 'overview';
        root.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== view);
        root.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.view === view)));
        el('.cu-context').textContent = {overview:'Border-mounted headings · live-style status strips',connection:'Square switches · aligned device rows',audio:'One panel · output, volume and brightness',notifications:'Square DND switch · notification history'}[view];
        el('.cu-feedback').textContent = 'Preview only · no system changes';
        if (view === 'connection') drawConnection();
        if (view === 'notifications') drawNotifications();
      }
      root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click',() => show(button.dataset.view)));
      root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click',() => { state.tab = button.dataset.tab; drawConnection(); }));
      root.querySelectorAll('.cu-node').forEach(node => {
        node.addEventListener('pointerenter',() => focusNode(node.dataset.node));
        node.addEventListener('focus',() => focusNode(node.dataset.node));
        node.addEventListener('click',() => { const view = node.dataset.node; focusNode(view); if (view !== 'share') { show(view); el('[data-view="' + view + '"]').focus(); } });
      });
      el('.cu-stage').addEventListener('keydown',event => { if (event.key === 'Escape') { event.preventDefault(); show('overview'); el('[data-view="overview"]').focus(); } });
      ['volume','brightness'].forEach(key => {
        el('#cu-' + key).addEventListener('input',event => { state[key] = Number(event.target.value); if (key === 'volume') state.muted = false; audioValues(); });
      });
      el('.cu-mute').addEventListener('click',() => { state.muted = !state.muted; audioValues(); });
      el('.cu-output').addEventListener('change',event => { state.output = event.target.value; audioValues(); });
      function renderDesign() { root.dataset.heading = design.heading; root.dataset.strip = design.strip; }
      renderDesign(); summaries(); focusNode('connection'); audioValues();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:el('.cu-stage'),onChange:renderDesign});
        tweak.addSelect(design,'heading',{label:'Frame heading typography',options:[{label:'Uppercase',value:'caps'},{label:'Title case',value:'title'}]});
        tweak.addSelect(design,'strip',{label:'Status strip separator',options:[{label:'Thin white rule',value:'divided'},{label:'Spacing only',value:'inline'}]});
      }
    })();


window.XLR8Archive.finish({"controls": false});
