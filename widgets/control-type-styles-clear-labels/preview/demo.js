
    (() => {
      const root = document.getElementById('ts-cc-type-styles');
      const stage = root.querySelector('.tt-stage');
      const state = {style:'clear',focused:'connection',headingOffset:0,trackingOffset:0,innerFrame:30};
      const labels = {clear:'A // CLEAR LABELS',mono:'B // SYSTEM MONO',condensed:'C // CONDENSED'};
      const corners = ['tl','tr','bl','br'].map(c => '<i class="tt-corner ' + c + '" aria-hidden="true"></i>').join('');
      root.querySelectorAll('.tt-face:not(.tt-center)').forEach(face => face.insertAdjacentHTML('beforeend',corners + '<span class="tt-side" aria-hidden="true"></span><span class="tt-square" aria-hidden="true"></span>'));
      root.querySelectorAll('.tt-node').forEach(node => {
        node.insertAdjacentHTML('beforeend','<span class="tt-focus" aria-hidden="true"></span>');
        const focus = () => focusNode(node.dataset.node);
        node.addEventListener('pointerenter',focus); node.addEventListener('focus',focus); node.addEventListener('click',focus);
      });
      const gate = '<span class="tt-glyph"><i class="tt-gate g1"></i><i class="tt-gate g2"></i><i class="tt-gate g3"></i><i class="tt-gate g4"></i><span class="tt-core"><i data-lucide="arrow-right" aria-hidden="true"></i></span></span>';
      root.querySelectorAll('.tt-arrow').forEach(arrow => arrow.innerHTML = gate);
      function focusNode(name) {
        state.focused = name;
        root.querySelectorAll('.tt-node').forEach(node => {
          const active = node.dataset.node === name;
          node.classList.toggle('tt-focused',active); node.setAttribute('aria-pressed',String(active));
        });
        const compact = root.getBoundingClientRect().width <= 620;
        const rest = compact ? {connection:0,share:0,notifications:0,audio:0} : {connection:-90,share:180,notifications:0,audio:90};
        const selected = compact ? {connection:180,share:180,notifications:180,audio:180} : {connection:90,share:0,notifications:180,audio:-90};
        root.querySelectorAll('.tt-arrow').forEach(arrow => {
          const active = arrow.dataset.axis === name;
          arrow.classList.toggle('tt-active',active);
          arrow.style.setProperty('--tt-angle',(active ? selected[arrow.dataset.axis] : rest[arrow.dataset.axis]) + 'deg');
        });
      }
      function render() {
        stage.dataset.style = state.style;
        stage.style.setProperty('--tt-title-offset',state.headingOffset + 'px');
        stage.style.setProperty('--tt-tracking-offset',state.trackingOffset + 'px');
        stage.style.setProperty('--tt-inner',state.innerFrame / 100);
        root.querySelector('.tt-selected-name').textContent = labels[state.style];
        root.querySelectorAll('.tt-choice').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.choice === state.style)));
      }
      root.querySelectorAll('.tt-choice').forEach(button => button.addEventListener('click',() => { state.style = button.dataset.choice; render(); }));
      new ResizeObserver(() => focusNode(state.focused)).observe(root);
      focusNode(state.focused); render();
      if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}});
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:stage,onChange:render});
        tweak.addSlider(state,'headingOffset',{label:'Heading size adjustment',min:-1,max:2,step:1,unit:'px'});
        tweak.addSlider(state,'trackingOffset',{label:'Heading letter spacing adjustment',min:-.2,max:.6,step:.2,unit:'px'});
        tweak.addSlider(state,'innerFrame',{label:'Inner frame opacity',min:20,max:50,step:5,unit:'%'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"clear\"]"}], "remove": ["button[data-choice]"], "controls": false});
