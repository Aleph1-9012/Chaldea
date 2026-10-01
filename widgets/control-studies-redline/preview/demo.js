
    (() => {
      const root = document.getElementById('ts-cc-studies');
      const el = selector => root.querySelector(selector);
      const shell = el('.cc-shell');
      const overview = el('.cc-cross');
      const view = el('.cc-detail-view');
      const panel = el('.cc-detail');
      const status = el('.cc-footer-state');
      const state = {wifi:true,bt:false,dnd:false,volume:64,brightness:72,muted:false,network:'Home network',output:'Speakers',headphones:false,file:false,tunnel:false,keep:false,notifications:2,grid:8.5};
      const sections = {
        connection:{name:'Connection',number:'01',tabs:[['wifi','Wi-Fi','通信'],['bt','Bluetooth','接続']]},
        share:{name:'Quickshare',number:'02',tabs:[['send','Send','送信'],['receive','Receive','受信']]},
        notifications:{name:'Notifications',number:'03',tabs:[['history','History','通知'],['dnd','Do Not Disturb','通知']]},
        audio:{name:'Audio / Display',number:'04',tabs:[['output','Output','出力'],['volume','Volume','音量'],['brightness','Brightness','輝度']]}
      };
      let branch = '';
      let tab = '';
      let focused = 'connection';
      const nodes = [...root.querySelectorAll('.cc-node')];
      const corners = '<i class="cc-corner tl" aria-hidden="true"></i><i class="cc-corner tr" aria-hidden="true"></i><i class="cc-corner bl" aria-hidden="true"></i><i class="cc-corner br" aria-hidden="true"></i>';
      [...nodes,el('.cc-center')].forEach(node => node.insertAdjacentHTML('beforeend',corners));
      function icons() { if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}}); }
      function focusBranch(name) { focused = name; nodes.forEach(node => node.classList.toggle('cc-focused',node.dataset.branch === name)); }
      function summaries() {
        el('[data-summary="connection"]').textContent = 'Wi-Fi ' + (state.wifi ? 'on' : 'off') + ' · BT ' + (state.bt ? 'on' : 'off');
        el('[data-summary="notifications"]').textContent = String(state.notifications).padStart(2,'0') + ' saved · DND ' + (state.dnd ? 'on' : 'off');
        el('[data-summary="audio"]').textContent = (state.muted ? 'Muted' : 'Vol ' + state.volume + '%') + ' · Bright ' + state.brightness + '%';
      }
      function controlToggle(key,label) {
        return '<button type="button" class="cc-toggle" data-toggle="' + key + '" aria-pressed="' + state[key] + '"><span>' + label + '</span><span class="cc-toggle-state">' + (state[key] ? 'ON' : 'OFF') + '</span></button>';
      }
      function row(label,icon,meta,active,action) {
        return '<button type="button" class="cc-row" data-row="' + action + '" aria-pressed="' + active + '"><i data-lucide="' + icon + '" aria-hidden="true"></i><span class="cc-row-name">' + label + '</span><span class="cc-row-meta">' + meta + '</span></button>';
      }
      function action(label,key,icon) {
        return '<button type="button" class="cc-action" data-action="' + key + '"><i data-lucide="' + icon + '" aria-hidden="true"></i>' + label + '</button>';
      }
      function range(key,label) {
        return '<div class="cc-measure"><label class="cc-measure-label" for="cc-' + key + '">' + label + '</label><output for="cc-' + key + '">' + state[key] + '<small>%</small></output></div><input id="cc-' + key + '" aria-label="' + label + '" class="cc-range" type="range" min="0" max="100" step="1" value="' + state[key] + '" data-range="' + key + '" style="--cc-value:' + state[key] + '%"><div class="cc-scale"><span>0</span><span>100</span></div>';
      }
      function drawPanel() {
        const item = sections[branch].tabs.find(item => item[0] === tab);
        let body = '';
        let detail = '';
        if (tab === 'wifi') {
          detail = state.wifi ? 'Connected · ' + state.network : 'Wi-Fi disabled';
          body = controlToggle('wifi','Wi-Fi');
          if (state.wifi) ['Home network','Studio','Guest'].forEach((name,index) => { body += row(name,'wifi',state.network === name ? 'LINKED' : ['92%','67%','38%'][index],state.network === name,'network:' + name); });
        } else if (tab === 'bt') {
          detail = state.bt ? (state.headphones ? 'Headphones connected' : 'Bluetooth enabled') : 'Bluetooth disabled';
          body = controlToggle('bt','Bluetooth');
          if (state.bt) body += row('Headphones','headphones',state.headphones ? 'LINKED' : 'PAIR',state.headphones,'headphones');
        } else if (tab === 'output') {
          detail = 'Active output · ' + state.output;
          ['Speakers','Headphones','HDMI output'].forEach((name,index) => { body += row(name,['speaker','headphones','monitor'][index],state.output === name ? 'ACTIVE' : '',state.output === name,'output:' + name); });
        } else if (tab === 'volume') {
          detail = state.muted ? 'Output muted' : 'Output · ' + state.output;
          body = range('volume','VOLUME') + controlToggle('muted','Mute audio');
        } else if (tab === 'brightness') {
          detail = 'Current display';
          body = range('brightness','BRIGHTNESS');
        } else if (tab === 'history') {
          detail = state.notifications + ' saved notifications';
          body = state.notifications ? '<div class="cc-notification"><small>FILES // 2 MIN AGO</small><span>Transfer complete</span></div><div class="cc-notification"><small>TERMINAL // 8 MIN AGO</small><span>Build finished</span></div>' + action('CLEAR HISTORY','clear','trash-2') : '<div class="cc-empty">No notifications</div>';
        } else if (tab === 'dnd') {
          detail = state.dnd ? 'Notifications silenced' : 'Notifications enabled';
          body = controlToggle('dnd','Do Not Disturb');
        } else if (tab === 'send') {
          detail = 'Send files';
          body = '<div class="cc-file">' + (state.file ? 'reference.png' : 'No file selected') + '</div>' + action(state.file ? 'CHANGE FILE' : 'PICK FILE','file','file-up') + '<div style="height:15px"></div>' + controlToggle('tunnel','Tunnel') + controlToggle('keep','Keep alive');
          if (state.file) body += action('GENERATE QR','qr','qr-code');
        } else if (tab === 'receive') {
          detail = 'Save to Downloads';
          body = controlToggle('tunnel','Tunnel') + controlToggle('keep','Keep alive') + action('OPEN RECEIVER','receive','download');
        }
        panel.innerHTML = '<header class="cc-detail-header"><h2 class="cc-detail-title">' + item[1].toUpperCase() + '</h2><span class="cc-detail-jp" lang="ja">' + item[2] + '</span></header><div class="cc-control-status">' + detail + '</div>' + body;
        panel.setAttribute('aria-label',item[1] + ' preview');
        panel.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click',() => {
          const key = button.dataset.toggle;
          state[key] = !state[key];
          if (key === 'bt' && !state.bt) state.headphones = false;
          drawPanel(); summaries();
          panel.querySelector('[data-toggle="' + key + '"]').focus();
          status.textContent = 'PREVIEW // ' + button.firstElementChild.textContent.toUpperCase() + ' ' + (state[key] ? 'ON' : 'OFF');
        }));
        panel.querySelectorAll('[data-range]').forEach(input => input.addEventListener('input',() => {
          const key = input.dataset.range;
          state[key] = Number(input.value);
          input.style.setProperty('--cc-value',input.value + '%');
          panel.querySelector('output').innerHTML = input.value + '<small>%</small>';
          summaries();
        }));
        panel.querySelectorAll('[data-row]').forEach(button => button.addEventListener('click',() => {
          const choice = button.dataset.row;
          if (choice.startsWith('network:')) state.network = choice.slice(8);
          if (choice.startsWith('output:')) state.output = choice.slice(7);
          if (choice === 'headphones') state.headphones = !state.headphones;
          drawPanel(); summaries();
          [...panel.querySelectorAll('[data-row]')].find(row => row.dataset.row === choice)?.focus();
          status.textContent = 'PREVIEW SELECTION UPDATED';
        }));
        panel.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click',() => {
          const key = button.dataset.action;
          if (key === 'file') { state.file = true; drawPanel(); status.textContent = 'SAMPLE FILE SELECTED'; }
          else if (key === 'clear') { state.notifications = 0; drawPanel(); summaries(); status.textContent = 'SAMPLE HISTORY CLEARED'; }
          else status.textContent = 'PREVIEW ONLY // NO TRANSFER STARTED';
        }));
        icons();
      }
      function setTab(key) {
        tab = key;
        root.querySelectorAll('.cc-subbutton').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.tab === tab)));
        drawPanel();
      }
      function openBranch(name) {
        focusBranch(name); branch = name;
        const data = sections[name];
        el('.cc-path').textContent = 'MENU / ' + data.name.toUpperCase();
        el('.cc-subheading').innerHTML = '<span>' + data.number + '</span><span>' + data.name + '</span>';
        el('.cc-subnav').replaceChildren();
        for (const item of data.tabs) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'cc-subbutton'; button.dataset.tab = item[0];
          button.innerHTML = '<span>' + item[1] + '</span><span class="cc-selection" aria-hidden="true"></span>';
          button.addEventListener('click',() => setTab(item[0]));
          el('.cc-subnav').append(button);
        }
        overview.hidden = true; view.hidden = false;
        setTab(data.tabs[0][0]);
        el('.cc-back').focus();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          view.animate([{transform:'translateX(18px)',opacity:.3},{transform:'translateX(0)',opacity:1}],{duration:400,easing:'cubic-bezier(.2,.7,.2,1)'});
        }
        status.textContent = 'DESIGN PREVIEW';
        el('.cc-keyhint').textContent = 'SELECT A CONTROL';
      }
      function back() {
        if (!branch) return;
        branch = ''; view.hidden = true; overview.hidden = false;
        nodes.find(node => node.dataset.branch === focused).focus();
        status.textContent = 'DESIGN PREVIEW'; el('.cc-keyhint').textContent = '↑↓←→ SELECT';
      }
      nodes.forEach(node => {
        node.addEventListener('pointerenter',() => focusBranch(node.dataset.branch));
        node.addEventListener('focus',() => focusBranch(node.dataset.branch));
        node.addEventListener('click',() => openBranch(node.dataset.branch));
      });
      el('.cc-back').addEventListener('click',back);
      shell.addEventListener('keydown',event => {
        if (event.key === 'Escape') { event.preventDefault(); back(); }
        if (!branch) {
          const direction = {ArrowUp:'connection',ArrowLeft:'share',ArrowRight:'notifications',ArrowDown:'audio'}[event.key];
          if (direction) { event.preventDefault(); nodes.find(node => node.dataset.branch === direction).focus(); }
        }
      });
      root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click',() => {
        root.dataset.design = button.dataset.choice;
        root.querySelectorAll('[data-choice]').forEach(other => other.setAttribute('aria-pressed',String(other === button)));
      }));
      function style() { root.style.setProperty('--cc-grid','rgba(204,21,21,' + state.grid / 100 + ')'); }
      style(); summaries(); icons();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:shell,onChange:style});
        tweak.addSlider(state,'grid',{label:'Panel grid opacity',min:0,max:16,step:.5,unit:'%'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"a\"]"}], "remove": ["button[data-choice]"], "controls": false});
