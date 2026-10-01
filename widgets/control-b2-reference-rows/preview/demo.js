
    (() => {
      const root = document.getElementById('ts-b2-reference-rows');
      const list = root.querySelector('.wr-list');
      const toggle = root.querySelector('.wr-toggle');
      const status = root.querySelector('.wr-status-text');
      const panel = root.querySelector('.wr-panel');
      const reopen = root.querySelector('.wr-reopen');
      const state = {enabled:true,selected:null};
      const design = {rowHeight:38,rowGap:8};
      const networks = [
        {name:'GNXS-2.4G-598048',strength:3},
        {name:'GNXS-5G-598048',strength:3},
        {name:'MADHU KIRAN',strength:1},
        {name:'MADHUKIRAN',strength:1},
        {name:'ACT-AI_102785161986',strength:1},
        {name:'VINAY',strength:1},
        {name:'102677678966',strength:1}
      ];
      function paintStatus() {
        root.dataset.enabled = String(state.enabled);
        status.textContent = state.enabled ? (state.selected ? 'Connected · ' + state.selected : 'Enabled · Scanning') : 'Disabled';
        toggle.querySelector('span').textContent = state.enabled ? 'DISABLE WI-FI' : 'ENABLE WI-FI';
      }
      function paintRows() {
        list.replaceChildren();
        if (!state.enabled) {
          const message = document.createElement('div');
          message.className = 'wr-empty-list';
          message.textContent = 'Wi-Fi disabled';
          list.append(message);
          return;
        }
        networks.forEach(network => {
          const row = document.createElement('button');
          row.type = 'button'; row.className = 'wr-row';
          row.dataset.network = network.name;
          row.setAttribute('aria-pressed',String(state.selected === network.name));
          row.setAttribute('aria-label',network.name + ', secured, signal ' + network.strength + ' of 3' + (state.selected === network.name ? ', selected' : ', select in preview'));
          const name = document.createElement('span'); name.className = 'wr-name'; name.textContent = network.name;
          const indicators = document.createElement('span'); indicators.className = 'wr-indicators'; indicators.setAttribute('aria-hidden','true');
          indicators.innerHTML = '<span class="wr-strength">' + Array.from({length:3},(_,index) => '<i' + (index < network.strength ? '' : ' class="wr-empty"') + '></i>').join('') + '</span><i data-lucide="lock-keyhole"></i>';
          row.append(name,indicators);
          row.addEventListener('click',() => {
            state.selected = network.name;
            paintStatus(); paintRows();
            Array.from(list.querySelectorAll('button')).find(button => button.dataset.network === network.name)?.focus({preventScroll:true});
          });
          list.append(row);
        });
        if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}});
      }
      toggle.addEventListener('click',() => { state.enabled = !state.enabled; state.selected = null; paintStatus(); paintRows(); });
      root.querySelector('.wr-close').addEventListener('click',() => { panel.hidden = true; reopen.hidden = false; reopen.focus({preventScroll:true}); });
      reopen.addEventListener('click',() => { panel.hidden = false; reopen.hidden = true; root.querySelector('.wr-close').focus({preventScroll:true}); });
      function paintDesign() { root.style.setProperty('--wr-row-height',design.rowHeight + 'px'); root.style.setProperty('--wr-row-gap',design.rowGap + 'px'); }
      paintStatus(); paintRows(); paintDesign();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:paintDesign});
        tweak.addSlider(design,'rowHeight',{label:'Network row height',min:34,max:44,step:2,unit:'px'});
        tweak.addSlider(design,'rowGap',{label:'Space between rows',min:6,max:12,step:1,unit:'px'});
      }
    })();


window.XLR8Archive.finish({"controls": false});
