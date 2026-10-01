
    (() => {
      const root = document.getElementById('ts-arrow-redesign');
      const state = {design:'relay',focused:'connection',size:36,rest:65,duration:320};
      const labels = {relay:'A // RELAY',dart:'B // DART',gate:'C // GATE',step:'D // STEPPED'};
      const shapes = {
        relay:'<i class="ta-pip"></i><i class="ta-link"></i><i class="ta-point"></i>',
        dart:'<i class="ta-tail"></i><i class="ta-dart"></i>',
        gate:'<i class="ta-gate g1"></i><i class="ta-gate g2"></i><i class="ta-gate g3"></i><i class="ta-gate g4"></i><span class="ta-core"><i data-lucide="arrow-right" aria-hidden="true"></i></span>',
        step:'<i class="ta-stem"></i>' + Array.from({length:7},(_,i) => '<i class="ta-step s' + (i+1) + '"></i>').join('')
      };
      const corners = ['tl','tr','bl','br'].map(c => '<i class="ta-corner ' + c + '" aria-hidden="true"></i>').join('');
      root.querySelectorAll('.ta-node').forEach(node => {
        node.insertAdjacentHTML('beforeend',corners + '<span class="ta-square" aria-hidden="true"></span><span class="ta-side" aria-hidden="true"></span><span class="ta-focus" aria-hidden="true"></span>');
        const focus = () => focusNode(node.dataset.node);
        node.addEventListener('pointerenter',focus);
        node.addEventListener('focus',focus);
        node.addEventListener('click',focus);
      });
      root.querySelectorAll('.ta-arrow').forEach(arrow => arrow.innerHTML = '<span class="ta-glyph"></span>');
      root.querySelectorAll('[data-sample]').forEach(sample => sample.innerHTML = shapes[sample.dataset.sample]);
      function focusNode(name) {
        state.focused = name;
        root.querySelectorAll('.ta-node').forEach(node => {
          const active = node.dataset.node === name;
          node.classList.toggle('ta-focused',active);
          node.setAttribute('aria-pressed',String(active));
        });
        const compact = root.getBoundingClientRect().width <= 620;
        const rest = compact ? {connection:0,share:0,notifications:0,audio:0} : {connection:-90,share:180,notifications:0,audio:90};
        const focused = compact ? {connection:180,share:180,notifications:180,audio:180} : {connection:90,share:0,notifications:180,audio:-90};
        root.querySelectorAll('.ta-arrow').forEach(arrow => {
          const active = arrow.dataset.axis === name;
          arrow.querySelector('.ta-glyph').classList.toggle('ta-lit',active);
          arrow.style.setProperty('--ta-angle',(active ? focused[arrow.dataset.axis] : rest[arrow.dataset.axis]) + 'deg');
        });
      }
      function render() {
        root.style.setProperty('--ta-size',state.size + 'px');
        root.style.setProperty('--ta-rest',state.rest / 100);
        root.style.setProperty('--ta-motion',state.duration + 'ms');
        root.querySelector('[data-size-label]').textContent = state.size + ' PX IN LAYOUT';
        root.querySelector('[data-design-label]').textContent = labels[state.design];
        root.querySelectorAll('.ta-option').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.design === state.design)));
        root.querySelectorAll('.ta-arrow .ta-glyph').forEach(glyph => {
          if (glyph.dataset.design !== state.design) {
            glyph.innerHTML = shapes[state.design];
            glyph.dataset.design = state.design;
          }
        });
        if (globalThis.lucide) lucide.createIcons({attrs:{width:16,height:16}});
        focusNode(state.focused);
      }
      root.querySelectorAll('.ta-option').forEach(button => button.addEventListener('click',() => { state.design = button.dataset.design; render(); }));
      new ResizeObserver(() => focusNode(state.focused)).observe(root);
      render();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:render});
        tweak.addSlider(state,'size',{label:'Arrow size',min:30,max:42,step:2,unit:'px'});
        tweak.addSlider(state,'rest',{label:'Resting visibility',min:35,max:85,step:5,unit:'%'});
        tweak.addSlider(state,'duration',{label:'Turn duration',min:240,max:520,step:20,unit:'ms'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"dart\"]"}], "remove": ["button[data-design]"], "controls": false});
