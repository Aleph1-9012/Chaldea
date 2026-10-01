
    (() => {
      const root = document.getElementById('ts-control-refinement');
      const el = selector => root.querySelector(selector);
      const slots = [...root.querySelectorAll('.cr-slot')];
      const arrows = [...root.querySelectorAll('.cr-arrow')];
      const detail = el('.cr-detail');
      const input = el('.cr-range');
      const config = {inner:22,subtitle:11,redArrow:true};
      const state = {mode:'refined',view:'overview',focused:'bottom',section:'brightness',brightness:72,volume:64,muted:false,output:'Speakers'};
      const cornerMarkup = ['tl','tr','bl','br'].map(position => '<i class="cr-corner ' + position + '" aria-hidden="true"></i>').join('');
      slots.forEach(slot => {
        slot.insertAdjacentHTML('afterbegin','<span class="cr-inner" aria-hidden="true"></span>');
        if (slot.dataset.slot === 'center') slot.insertAdjacentHTML('beforeend',['tl','tr','bl','br'].map(position => '<i class="cr-center-diamond ' + position + '" aria-hidden="true"></i>').join(''));
        else slot.insertAdjacentHTML('beforeend',cornerMarkup + '<span class="cr-side-strip" aria-hidden="true"></span><span class="cr-square" aria-hidden="true"></span><span class="cr-focus-mark" aria-hidden="true"></span>');
      });
      detail.insertAdjacentHTML('beforeend',cornerMarkup);
      function drawArrows() {
        const rest = {top:180,bottom:0,left:90,right:-90};
        const focus = {top:0,bottom:180,left:-90,right:90};
        for (const arrow of arrows) {
          const axis = arrow.dataset.axis;
          const active = axis === state.focused;
          const red = active && state.mode === 'refined' && config.redArrow;
          arrow.classList.toggle('cr-active',active);
          arrow.style.setProperty('--cr-angle',(active ? focus[axis] : rest[axis]) + 'deg');
          const canvas = arrow.querySelector('canvas');
          const context = canvas.getContext('2d');
          context.clearRect(0,0,72,72);
          context.fillStyle = red ? '#cc1515' : '#111111';
          context.strokeStyle = red ? '#cc1515' : 'rgba(232,232,232,.35)';
          context.lineWidth = 1.2;
          // Original TsugumoriArrow silhouette, using its existing QML coordinates.
          const points = [[.08,.32],[.18,.22],[.37,.39],[.50,.27],[.63,.39],[.82,.22],[.92,.32],[.68,.51],[.50,.94],[.32,.51]];
          context.beginPath();
          points.forEach((point,index) => { if (!index) context.moveTo(point[0]*72,point[1]*72); else context.lineTo(point[0]*72,point[1]*72); });
          context.closePath(); context.fill(); context.stroke();
        }
      }
      function setFocus(key) {
        state.focused = key;
        slots.forEach(slot => {
          const selected = slot.dataset.slot === key;
          slot.classList.toggle('cr-focused',selected);
          slot.setAttribute('aria-pressed',String(selected));
        });
        drawArrows();
      }
      function refreshDetail() {
        const key = state.section;
        const isOutput = key === 'output';
        const value = key === 'brightness' ? state.brightness : state.volume;
        el('.cr-detail-heading h2').textContent = key === 'output' ? 'AUDIO OUTPUT' : key.toUpperCase();
        el('.cr-value').textContent = isOutput ? '' : value + '%';
        el('.cr-value').hidden = isOutput;
        el('.cr-status-text').textContent = isOutput ? state.output : state.mode === 'current' ? ((key === 'volume' && state.muted) ? 'Muted' : value + '%') : key === 'brightness' ? 'Current display' : state.muted ? 'Audio muted' : state.output;
        el('.cr-range-area').hidden = isOutput;
        el('.cr-outputs').hidden = !isOutput;
        el('.cr-mute').hidden = key !== 'volume';
        el('.cr-mute').textContent = state.muted ? 'UNMUTE' : 'MUTE';
        el('.cr-mute').setAttribute('aria-pressed',String(state.muted));
        el('.cr-range-hint').textContent = key === 'volume' ? (state.mode === 'current' ? 'Right-click track to mute · Scroll to adjust' : 'Drag to adjust · Right-click to mute') : 'Drag or scroll to adjust';
        input.min = key === 'brightness' ? '1' : '0';
        input.value = String(value);
        input.setAttribute('aria-label',key === 'brightness' ? 'Brightness' : 'Volume');
        el('.cr-range-box').style.setProperty('--cr-level',((key === 'volume' && state.muted) ? 0 : value) + '%');
        root.querySelectorAll('[data-section]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.section === key)));
        root.querySelectorAll('[data-output]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.output === state.output)));
      }
      function style() {
        root.dataset.mode = state.mode;
        root.style.setProperty('--cr-inner',config.inner/100);
        root.style.setProperty('--cr-sub-size',config.subtitle + 'px');
        root.querySelectorAll('.cr-compare').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === state.mode)));
        el('.cr-caption-state').textContent = (state.mode === 'refined' ? 'Refined' : 'Current') + ' · preview only';
        drawArrows(); refreshDetail();
      }
      function setView(view) {
        state.view = view; root.dataset.view = view;
        el('.cr-cross').hidden = view !== 'overview';
        el('.cr-audio').hidden = view !== 'audio';
        el('.cr-view-picker').value = view;
        el('.cr-help').textContent = view === 'overview' ? 'Hover or select a panel' : 'Sample values · sliders do not affect your desktop';
      }
      slots.forEach(slot => {
        const focus = () => setFocus(slot.dataset.slot);
        slot.addEventListener('pointerenter',focus); slot.addEventListener('focus',focus); slot.addEventListener('click',focus);
      });
      el('.cr-cross').addEventListener('keydown',event => {
        const map = {ArrowUp:'top',ArrowDown:'bottom',ArrowLeft:'left',ArrowRight:'right',Escape:'center'};
        if (map[event.key]) { event.preventDefault(); slots.find(slot => slot.dataset.slot === map[event.key]).focus(); }
      });
      root.querySelectorAll('.cr-compare').forEach(button => button.addEventListener('click',() => { state.mode = button.dataset.mode; style(); }));
      root.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click',() => { state.section = button.dataset.section; refreshDetail(); }));
      root.querySelectorAll('[data-output]').forEach(button => button.addEventListener('click',() => { state.output = button.dataset.output; refreshDetail(); }));
      el('.cr-view-picker').addEventListener('change',event => setView(event.target.value));
      input.addEventListener('input',() => { state[state.section] = Number(input.value); if (state.section === 'volume') state.muted = false; refreshDetail(); });
      input.addEventListener('wheel',event => {
        event.preventDefault();
        state[state.section] = Math.max(state.section === 'brightness' ? 1 : 0,Math.min(100,state[state.section] + (event.deltaY < 0 ? 5 : -5)));
        if (state.section === 'volume') state.muted = false;
        refreshDetail();
      },{passive:false});
      input.addEventListener('contextmenu',event => { event.preventDefault(); if (state.section === 'volume') { state.muted = !state.muted; refreshDetail(); } });
      el('.cr-mute').addEventListener('click',() => { state.muted = !state.muted; refreshDetail(); });
      setFocus(state.focused); style();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:el('.cr-stage'),onChange:style});
        tweak.addSlider(config,'inner',{label:'Refined inner border opacity',min:15,max:35,step:1,unit:'%'});
        tweak.addSlider(config,'subtitle',{label:'Refined subtitle size',min:11,max:12,step:1,unit:'px'});
        tweak.addToggle(config,'redArrow',{label:'Red focused arrow in refined view'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-mode=\"current\"]"}], "remove": ["button[data-mode]"], "controls": false});
