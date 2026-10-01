
    (() => {
      const root = document.getElementById('ts-arrow-study');
      const state = {design:'armored',focused:'connection',size:36,stroke:1.2,rest:60,duration:320};
      const labels = {outline:'A // REINFORCED',armored:'B // FILLED WINGS',split:'C // SPLIT CREST'};
      // Preserve the existing TsugumoriArrow silhouette from the control center.
      const crest = [[.08,.32],[.18,.22],[.37,.39],[.50,.27],[.63,.39],[.82,.22],[.92,.32],[.68,.51],[.50,.94],[.32,.51]];
      const core = [[.50,.36],[.61,.48],[.50,.79],[.39,.48]];
      const wing = [[.08,.32],[.18,.22],[.36,.40],[.31,.51]];
      const spear = [[.50,.32],[.60,.46],[.50,.93],[.40,.46]];
      const corners = ['tl','tr','bl','br'].map(c => '<i class="ta-corner ' + c + '" aria-hidden="true"></i>').join('');
      root.querySelectorAll('.ta-node').forEach(node => {
        node.insertAdjacentHTML('beforeend',corners + '<span class="ta-square" aria-hidden="true"></span><span class="ta-side" aria-hidden="true"></span><span class="ta-focus" aria-hidden="true"></span>');
        const focus = () => focusNode(node.dataset.node);
        node.addEventListener('pointerenter',focus);
        node.addEventListener('focus',focus);
        node.addEventListener('click',focus);
      });
      root.querySelectorAll('.ta-arrow').forEach(arrow => {
        for (const mode of ['rest','focused']) {
          const canvas = document.createElement('canvas');
          canvas.width = 144; canvas.height = 144; canvas.dataset.state = mode;
          arrow.append(canvas);
        }
      });
      function draw(canvas,design,active) {
        const ctx = canvas.getContext('2d');
        const scale = canvas.width;
        ctx.clearRect(0,0,scale,scale);
        ctx.save();
        ctx.scale(scale,scale);
        ctx.lineJoin = 'miter'; ctx.miterLimit = 3;
        ctx.lineWidth = state.stroke / 36;
        const white = active ? '#e8e8e8' : 'rgba(232,232,232,' + state.rest / 100 + ')';
        const ink = '#0a0a0a', red = '#cc1515';
        function shape(points,fill,stroke) {
          ctx.beginPath();
          points.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
          ctx.closePath();
          if (fill) { ctx.fillStyle = fill; ctx.fill(); }
          if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
        }
        if (design === 'outline') {
          shape(crest,ink,white);
          if (active) shape([[.40,.65],[.60,.65],[.50,.89]],red,null);
        } else if (design === 'armored') {
          shape(crest,white,null);
          shape(core,active ? red : ink,null);
        } else {
          shape(wing,ink,white);
          shape(wing.map(p => [1-p[0],p[1]]),ink,white);
          shape(spear,active ? red : ink,active ? red : white);
        }
        ctx.restore();
      }
      function focusNode(name) {
        state.focused = name;
        root.querySelectorAll('.ta-node').forEach(node => {
          const active = node.dataset.node === name;
          node.classList.toggle('ta-focused',active);
          node.setAttribute('aria-pressed',String(active));
        });
        const compact = root.getBoundingClientRect().width <= 620;
        const rest = compact ? {connection:-90,share:-90,notifications:-90,audio:-90} : {connection:180,share:90,notifications:-90,audio:0};
        const focused = compact ? {connection:90,share:90,notifications:90,audio:90} : {connection:0,share:-90,notifications:90,audio:180};
        root.querySelectorAll('.ta-arrow').forEach(arrow => {
          const active = arrow.dataset.axis === name;
          arrow.classList.toggle('ta-active',active);
          arrow.style.setProperty('--ta-angle',(active ? focused[arrow.dataset.axis] : rest[arrow.dataset.axis]) + 'deg');
        });
      }
      function render() {
        root.style.setProperty('--ta-size',state.size + 'px');
        root.style.setProperty('--ta-motion',state.duration + 'ms');
        root.querySelector('[data-size-label]').textContent = state.size + ' PX IN LAYOUT';
        root.querySelector('[data-design-label]').textContent = labels[state.design];
        root.querySelectorAll('[data-design]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.design === state.design)));
        root.querySelectorAll('[data-sample]').forEach(canvas => draw(canvas,canvas.dataset.sample,canvas.dataset.state === 'focused'));
        root.querySelectorAll('.ta-arrow canvas').forEach(canvas => draw(canvas,state.design,canvas.dataset.state === 'focused'));
        focusNode(state.focused);
      }
      root.querySelectorAll('[data-design]').forEach(button => button.addEventListener('click',() => { state.design = button.dataset.design; render(); }));
      new ResizeObserver(() => focusNode(state.focused)).observe(root);
      render();
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:render});
        tweak.addSlider(state,'size',{label:'Arrow size',min:30,max:42,step:2,unit:'px'});
        tweak.addSlider(state,'rest',{label:'Resting visibility',min:35,max:85,step:5,unit:'%'});
        tweak.addSlider(state,'stroke',{label:'Outline weight',min:.8,max:1.6,step:.1,unit:'px'});
        tweak.addSlider(state,'duration',{label:'Turn duration',min:240,max:520,step:20,unit:'ms'});
      }
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"outline\"]"}], "remove": ["button[data-design]"], "controls": false});
