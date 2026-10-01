
    (() => {
      const root = document.getElementById('ts-text-iterations');
      const grid = root.querySelector('.tx-grid');
      const variants = [
        {id:'A',name:'Live decode',note:'Left to right · 280 ms',effect:'decode',duration:280},
        {id:'B',name:'Rolling type',note:'Letter-by-letter roll · 340 ms',effect:'roll',duration:340},
        {id:'C',name:'Scan decode',note:'Moving glyph band · 320 ms',effect:'scan',duration:320},
        {id:'D',name:'Split register',note:'Two halves align · 300 ms',effect:'split',duration:300}
      ];
      const alphabet = '▸◆▪▫░▒▓█/\\|-_=+*';
      const settings = {speed:1};
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const animations = new Map();
      const studies = [];
      const corners = ['tl','tr','bl','br'].map(c => '<i class="tx-corner ' + c + '" aria-hidden="true"></i>').join('');
      function feedback(text) { root.querySelector('.tx-foot').textContent = text; }
      function randomGlyph() { return alphabet[Math.floor(Math.random() * alphabet.length)]; }
      function setLabel(label,text) {
        stopText(label);
        label.dataset.text = text;
        label.replaceChildren();
        label.setAttribute('aria-hidden','true');
        for (const char of Array.from(text)) {
          const cell = document.createElement('span'); cell.className = 'tx-char';
          const face = document.createElement('span'); face.className = 'tx-face'; face.textContent = char === ' ' ? '\u00a0' : char;
          const window = document.createElement('span'); window.className = 'tx-roll-window';
          const strip = document.createElement('span'); strip.className = 'tx-roll-strip';
          for (const value of [char === ' ' ? '\u00a0' : randomGlyph(),char === ' ' ? '\u00a0' : randomGlyph(),face.textContent]) { const part = document.createElement('span'); part.textContent = value; strip.append(part); }
          window.append(strip); cell.append(face,window); label.append(cell);
        }
        for (const side of ['top','bottom']) {
          const half = document.createElement('span'); half.className = 'tx-split tx-' + side;
          for (const char of Array.from(text)) { const cell = document.createElement('span'); cell.className = 'tx-char'; cell.textContent = char === ' ' ? '\u00a0' : char; half.append(cell); }
          label.append(half);
        }
      }
      function stopText(label) {
        const active = animations.get(label);
        if (active) { cancelAnimationFrame(active.frame); active.effects.forEach(effect => effect.cancel()); animations.delete(label); }
        label.classList.remove('tx-running');
        const text = label.dataset.text || '';
        label.querySelectorAll(':scope > .tx-char > .tx-face').forEach((face,i) => { face.textContent = text[i] === ' ' ? '\u00a0' : text[i]; face.style.removeProperty('color'); });
      }
      function playText(label,variant) {
        stopText(label);
        if (reduced.matches) return;
        const text = label.dataset.text;
        const duration = variant.duration / settings.speed;
        const cells = Array.from(label.querySelectorAll(':scope > .tx-char'));
        const faces = cells.map(cell => cell.querySelector('.tx-face'));
        label.dataset.effect = variant.effect;
        label.classList.add('tx-running');
        const run = {frame:0,effects:[]}; animations.set(label,run);
        const finish = () => { if (animations.get(label) === run) stopText(label); };
        if (variant.effect === 'roll') {
          cells.forEach((cell,i) => {
            const delay = (i / Math.max(1,cells.length - 1)) * duration * .25;
            run.effects.push(cell.querySelector('.tx-roll-strip').animate([{transform:'translateY(0)'},{transform:'translateY(-66.6667%)'}],{duration:duration * .75,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'}));
          });
          Promise.all(run.effects.map(effect => effect.finished)).then(finish).catch(() => {});
          return;
        }
        if (variant.effect === 'split') {
          for (const [side,offset] of [['top',-7],['bottom',7]]) {
            run.effects.push(label.querySelector('.tx-' + side).animate([{transform:'translateX(' + offset + 'px)'},{transform:'translateX(0)'}],{duration,easing:'cubic-bezier(.76,0,.24,1)',fill:'both'}));
          }
          Promise.all(run.effects.map(effect => effect.finished)).then(finish).catch(() => {});
          return;
        }
        const started = performance.now();
        let previousTick = -1;
        const scanColour = getComputedStyle(label).getPropertyValue('--tx-scan').trim();
        function tick(now) {
          if (animations.get(label) !== run) return;
          const t = Math.min(1,(now - started) / duration);
          if (t >= 1) { finish(); return; }
          const tickNumber = Math.floor((now - started) / 16);
          if (tickNumber !== previousTick) {
            previousTick = tickNumber;
            faces.forEach((face,i) => {
              if (text[i] === ' ') return;
              if (variant.effect === 'decode') {
                const reveal = i / text.length;
                face.textContent = t > reveal + .15 ? text[i] : t > reveal ? randomGlyph() : '\u00a0';
              } else {
                const distance = Math.abs(i / Math.max(1,text.length - 1) - (t * 1.3 - .15));
                face.textContent = distance < .1 ? randomGlyph() : text[i];
                face.style.color = distance < .13 ? scanColour : '';
              }
            });
          }
          run.frame = requestAnimationFrame(tick);
        }
        if (variant.effect === 'decode') faces.forEach(face => { face.textContent = '\u00a0'; });
        run.frame = requestAnimationFrame(tick);
      }
      function bindText(control,variant) {
        const label = control.querySelector('.tx-label');
        const start = () => { if (control.getAttribute('aria-pressed') !== 'true') playText(label,variant); };
        control.addEventListener('pointerenter',start);
        control.addEventListener('focus',() => { if (!control.matches(':hover')) start(); });
        control.addEventListener('pointerleave',() => { if (!control.matches(':focus-visible')) stopText(label); });
        control.addEventListener('blur',() => { if (!control.matches(':hover')) stopText(label); });
      }
      function cancelDemo(study) {
        study.timers.forEach(clearTimeout); study.timers = [];
        study.node.querySelectorAll('.tx-demo').forEach(control => control.classList.remove('tx-demo'));
      }
      function replay(study) {
        cancelDemo(study);
        const controls = [study.node.querySelector('.tx-heading-button'),study.node.querySelector('.tx-action'),study.node.querySelector('.tx-row:not([aria-pressed="true"])')].filter(Boolean);
        controls.forEach((control,i) => {
          study.timers.push(setTimeout(() => {
            if (control.getAttribute('aria-pressed') === 'true') return;
            control.classList.add('tx-demo'); playText(control.querySelector('.tx-label'),study.variant);
            study.timers.push(setTimeout(() => control.classList.remove('tx-demo'),study.variant.duration / settings.speed + 180));
          },i * (study.variant.duration / settings.speed + 100)));
        });
      }
      for (const variant of variants.filter(item => item.id === "B")) {
        const figure = document.createElement('figure'); figure.className = 'tx-study'; figure.dataset.variant = variant.id;
        figure.setAttribute('aria-label',variant.id + ', ' + variant.name);
        figure.innerHTML = '<figcaption class="tx-caption"><div><span class="tx-name">' + variant.id + ' // ' + variant.name + '</span><span class="tx-desc">' + variant.note + '</span></div><button type="button" class="tx-replay" data-replay aria-label="Replay ' + variant.id + ', ' + variant.name + '">REPLAY</button></figcaption><div class="tx-stage"><section class="tx-panel" aria-label="' + variant.name + ' connection sample"><div class="tx-head"><span class="tx-index">01</span><button class="tx-heading-button" type="button" aria-label="Preview Connection title animation"><span class="tx-label"></span></button></div><h2 class="tx-section">WI-FI</h2><div class="tx-status"><i class="tx-dot" aria-hidden="true"></i><span class="tx-status-text">Connected · GNXS-2.4G-598048</span></div><button class="tx-action" type="button" aria-label="Disable Wi-Fi in this sample"><i class="tx-diamond" aria-hidden="true"></i><span class="tx-label"></span></button><div class="tx-list" aria-label="Sample networks"></div><p class="tx-empty" hidden>Wi-Fi is off</p>' + corners + '</section></div>';
        grid.append(figure);
        const study = {node:figure,variant,timers:[],enabled:true,selected:'GNXS-2.4G-598048'}; studies.push(study);
        const heading = figure.querySelector('.tx-heading-button');
        const action = figure.querySelector('.tx-action');
        const list = figure.querySelector('.tx-list');
        setLabel(heading.querySelector('.tx-label'),'CONNECTION'); bindText(heading,variant);
        heading.addEventListener('click',() => playText(heading.querySelector('.tx-label'),variant));
        setLabel(action.querySelector('.tx-label'),'DISABLE WI-FI'); bindText(action,variant);
        for (const [name,strength] of [['GNXS-2.4G-598048',3],['GNXS-5G-598048',3],['MADHU KIRAN',1]]) {
          const row = document.createElement('button'); row.type = 'button'; row.className = 'tx-row'; row.dataset.network = name;
          row.setAttribute('aria-label',name); row.setAttribute('aria-pressed',String(name === study.selected)); row.setAttribute('aria-description','Sample secured network. Signal ' + strength + ' of 3.');
          row.innerHTML = '<span class="tx-label"></span><span class="tx-indicators" aria-hidden="true"><span class="tx-strength">' + Array.from({length:3},(_,i) => '<i' + (i >= strength ? ' class="tx-dim"' : '') + '></i>').join('') + '</span><i data-lucide="lock-keyhole" aria-hidden="true"></i></span>';
          list.append(row); setLabel(row.querySelector('.tx-label'),name); bindText(row,variant);
          row.addEventListener('click',() => {
            cancelDemo(study); study.selected = name;
            list.querySelectorAll('.tx-row').forEach(button => { button.setAttribute('aria-pressed',String(button === row)); if (button === row) stopText(button.querySelector('.tx-label')); });
            figure.querySelector('.tx-status-text').textContent = 'Connected · ' + name;
            feedback(variant.id + ' // ' + name + ' selected · sample only');
          });
        }
        action.addEventListener('click',() => {
          cancelDemo(study); study.enabled = !study.enabled;
          list.hidden = !study.enabled; figure.querySelector('.tx-empty').hidden = study.enabled;
          figure.querySelector('.tx-dot').classList.toggle('tx-off',!study.enabled);
          figure.querySelector('.tx-status-text').textContent = study.enabled ? 'Connected · ' + study.selected : 'Disabled';
          action.setAttribute('aria-label',(study.enabled ? 'Disable' : 'Enable') + ' Wi-Fi in this sample');
          setLabel(action.querySelector('.tx-label'),(study.enabled ? 'DISABLE' : 'ENABLE') + ' WI-FI'); playText(action.querySelector('.tx-label'),variant);
          feedback(variant.id + ' // Sample Wi-Fi ' + (study.enabled ? 'enabled' : 'disabled'));
        });
        figure.querySelector('[data-replay]').addEventListener('click',() => replay(study));
      }
      root.querySelector('[data-replay-all]').addEventListener('click',() => { studies.forEach(replay); feedback(reduced.matches ? 'Reduced motion enabled · labels remain still' : 'Replaying all four text effects'); });
      reduced.addEventListener('change',() => { studies.forEach(cancelDemo); Array.from(animations.keys()).forEach(stopText); });
      document.addEventListener('visibilitychange',() => { if (document.hidden) { studies.forEach(cancelDemo); Array.from(animations.keys()).forEach(stopText); } });
      if (globalThis.lucide) lucide.createIcons({attrs:{width:12,height:12}});
      if (globalThis.Tweak) {
        const tweak = new Tweak({container:root,onChange:() => { studies.forEach(study => { cancelDemo(study); study.node.querySelector('.tx-desc').textContent = study.variant.note.replace(/\d+ ms/,Math.round(study.variant.duration / settings.speed) + ' ms'); }); Array.from(animations.keys()).forEach(stopText); }});
        tweak.addSlider(settings,'speed',{label:'Text playback speed',min:.5,max:1.5,step:.25,unit:'×'});
      }
    })();


window.XLR8Archive.finish({"controls": false});
