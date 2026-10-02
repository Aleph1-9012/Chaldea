
(() => {
  const root = document.getElementById('ts-reactive-lock-studies');
  if (!root) return;
  const screen = root.querySelector('.tr-screen');
  const canvas = root.querySelector('.tr-art');
  const context = canvas.getContext('2d');
  const pass = root.querySelector('#tr-study-pass');
  const status = root.querySelector('.tr-status');
  const description = root.querySelector('[data-design-description]');
  const buttons = [...root.querySelectorAll('button[data-design]')];
  const modal = root.querySelector('.tr-modal');
  const back = root.querySelector('.tr-back');
  const unlock = root.querySelector('.tr-unlock');
  const inertTargets = ['.tr-header','.tr-main','.tr-footer'].map(s => root.querySelector(s));
  const designs = {
    a: {name:'Relay tiles', detail:'Quarter-turn tiles reconnect as you type. Backspace turns them back.'},
    b: {name:'Shutter bank', detail:'Small shutters slide open in staggered groups, revealing red plates.'},
    c: {name:'Phase screens', detail:'Two fine screens shift across one another, changing the interference pattern.'},
    d: {name:'Formation field', detail:'Paired needles rotate into local formations as red patches spread through the field.'},
    e: {name:'Stencil assembly', detail:'Offset strips of 継衛 slide into register and acquire red ink as you type.'},
    f: {name:'Typesetter', detail:'Mechanical glyph fragments rearrange in place, with no moving snake or full-width divider.'}
  };
  const state = { motion:true, duration:100, red:100 };
  const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let design = 'a', count = 0, phase = 0, motion = null, frame = null;
  let composing = false, compositionEcho = false, previewTimer = null, lastFocus = null;
  const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const smooth = v => { const t=clamp(v); return t*t*(3-2*t); };
  // A two-dimensional integer hash avoids the old modulo formula's repeated rows.
  function hash(x,y,seed=0) {
    let n = Math.imul(x+1,374761393) ^ Math.imul(y+1,668265263) ^ Math.imul(seed+1,1442695041);
    n = Math.imul(n ^ (n>>>13),1274126177);
    return ((n ^ (n>>>16))>>>0) / 4294967296;
  }
  const ink = {black:'#090909', dark:'#282724', grey:'#68665e', light:'#b7b3a8', red:'#d1161c', bright:'#ed272d'};
  const rankings = {};
  function rankFor(cols,rows,seed) {
    const key = `${cols}/${rows}/${seed}`;
    if (!rankings[key]) {
      const ordered=Array.from({length:cols*rows},(_,i)=>i).sort((a,b)=>hash(a%cols,Math.floor(a/cols),seed)-hash(b%cols,Math.floor(b/cols),seed));
      const rank=[]; ordered.forEach((cell,i)=>rank[cell]=i); rankings[key]=rank;
    }
    return rankings[key];
  }
  function colour(t) {
    t=clamp(t*state.red/100);
    const a=[104,102,94], b=[209,22,28];
    return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;
  }
  // Each study is a pure function of input length, never of the typed characters.
  // A lower phase recreates the same earlier geometry, including during reversal.
  function makeArt(kind,p) {
    const marks=[];
    const path=(points,c=ink.grey,w=1,alpha=1)=>marks.push({type:'path',points,c,w,alpha});
    const rect=(x,y,w,h,c=ink.grey,alpha=1)=>marks.push({type:'rect',x,y,w,h,c,alpha});
    const text=(value,x,y,size,c,clip)=>marks.push({type:'text',value,x,y,size,c,clip,alpha:1});
    const transform=(points,cx,cy,angle)=>points.map(([x,y])=>[cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)]);
    if (kind==='a') {
      const ranks=rankFor(8,8,4), cell=29;
      for(let y=0;y<8;y++) for(let x=0;x<8;x++) {
        const rank=ranks[y*8+x], cx=24.5+x*cell, cy=24.5+y*cell;
        const offset=rank%12;
        const step=Math.floor(p/12), local=clamp(p-step*12-offset);
        const angle=(Math.floor(hash(x,y,2)*4)+step+smooth(local))*Math.PI/2;
        const power=smooth((p*3+9-rank)/3);
        const c=colour(power);
        const one=[[-14.5,0],[-8,0],[-8,-8],[0,-8],[0,-14.5]];
        const two=[[0,14.5],[0,8],[8,8],[8,0],[14.5,0]];
        path(transform(one,cx,cy,angle),c,1.35);
        path(transform(two,cx,cy,angle),c,1.35);
        rect(cx-1,cy-1,2,2,power>.5?ink.red:ink.dark);
      }
    } else if(kind==='b') {
      const ranks=rankFor(6,9,11);
      for(let y=0;y<9;y++) for(let x=0;x<6;x++) {
        const i=y*6+x, rank=ranks[i], px=10+x*39, py=9+y*26;
        const open=smooth((p*.75+9-rank)/2);
        const vertical=hash(x,y,2)>.52;
        const w=34,h=21;
        rect(px,py,w,h,ink.dark);
        rect(px+1,py+1,w-2,h-2,colour(.75+.25*open));
        // The cover retracts along either its horizontal or vertical rail.
        if(vertical) rect(px,py,w,h*(1-open), '#171715');
        else rect(px,py,w*(1-open),h, '#171715');
        if(vertical) path([[px,py+h*(1-open)],[px+w,py+h*(1-open)]],open>.1?ink.light:ink.grey,1);
        else path([[px+w*(1-open),py],[px+w*(1-open),py+h]],open>.1?ink.light:ink.grey,1);
        path([[px+3,py+4],[px+7,py+4]],open>.5?ink.black:ink.grey,1);
        rect(px+w-4,py+h-4,2,2,open>.5?ink.black:ink.grey);
      }
    } else if(kind==='c') {
      // Slightly different pitches and angles produce a moiré pattern.
      for(let i=-25;i<82;i++) {
        const points=[];
        for(let y=-8;y<=260;y+=8) points.push([i*4.5+Math.sin(y*.013)*8,y]);
        path(points,ink.grey,.75,.68);
      }
      const angle=.045+p*.009;
      for(let i=-36;i<85;i++) {
        const points=[];
        for(let y=-8;y<=260;y+=6) {
          const x=i*4.7+Math.sin(y*.015+p*.11)*12+p*1.8;
          points.push([126+(x-126)*Math.cos(angle)-(y-126)*Math.sin(angle),126+(x-126)*Math.sin(angle)+(y-126)*Math.cos(angle)]);
        }
        path(points,i%7<2?colour(1):ink.black,i%7<2?1.2:2.2,i%7<2?.94:1);
      }
      for(let j=0;j<4;j++) {
        const x=20+j*67, y=126+Math.sin(j*1.8+p*.045)*98;
        path([[x-3,y],[x+3,y]],ink.light,1,.7);
        path([[x,y-3],[x,y+3]],ink.light,1,.7);
      }
    } else if(kind==='d') {
      for(let y=0;y<14;y++) for(let x=0;x<14;x++) {
        const cx=9+x*18,cy=9+y*18;
        const field=Math.sin(x*.29+p*.17)*1.05+Math.cos(y*.28-p*.12)*.9;
        const a=field+Math.sin((x+y)*.21)*.4;
        const wave=Math.sin(x*.29-y*.33+p*.19);
        const t=smooth((wave-.55+p*.014)*4);
        const l=5.8+1.8*t;
        const c=colour(t);
        path(transform([[-l,-1.8],[l,-1.8]],cx,cy,a),c,1.15);
        path(transform([[-l+2,1.8],[l-2,1.8]],cx,cy,a),c,1.15);
        if((x+y)%3===0) rect(cx-.65,cy-.65,1.3,1.3,ink.dark);
      }
    } else if(kind==='e') {
      const ranks=rankFor(1,12,16);
      for(let band=0;band<12;band++) {
        const sy=6+band*20;
        const order=ranks[band], settle=smooth((p-order*.85)/2);
        const direction=band%2?1:-1;
        const dx=direction*(8+hash(band,0,1)*12)*(1-settle)+Math.sin(p*.7+band*.9)*(1+settle);
        const tint=smooth((p*1.2+1-order)/2);
        text('継',126+dx,117,112,colour(tint),[8,sy,236,18.5]);
        text('衛',126+dx,237,112,colour(tint),[8,sy,236,18.5]);
        path([[10,sy+8],[15+5*settle,sy+8]],tint>.5?ink.red:ink.grey,.8);
        path([[237-5*settle,sy+8],[242,sy+8]],tint>.5?ink.red:ink.grey,.8);
      }
      path([[5,6],[5,246]],ink.dark,.8);
      path([[247,6],[247,246]],ink.dark,.8);
    } else if(kind==='f') {
      const motifs=[
        [[-5,-6],[-5,5],[-5,5],[4,5],[1,-6],[5,-6]],
        [[-5,-5],[5,5],[-5,5],[-1,1],[2,-5],[5,-5]],
        [[-5,0],[5,0],[0,-6],[0,6],[4,4],[5,4]],
        [[-4,-6],[-4,1],[-4,1],[5,1],[5,1],[5,6]],
        [[-5,5],[5,-5],[-5,-5],[-5,-2],[2,5],[5,5]],
        [[-5,-5],[5,-5],[5,-5],[5,5],[-5,5],[0,5]],
        [[-4,-6],[-4,6],[0,-2],[5,-2],[5,-2],[5,4]],
        [[-5,-5],[-1,-5],[-1,-5],[-1,5],[2,0],[6,0]]
      ];
      const ranks=rankFor(14,14,7);
      for(let y=0;y<14;y++) for(let x=0;x<14;x++) {
        const rank=ranks[y*14+x], cx=9+x*18,cy=9+y*18;
        const local=p*.55+hash(x,y,3)*3;
        const step=Math.floor(local), f=smooth(local-step);
        const from=Math.floor(hash(x,y,19+step)*motifs.length);
        const to=Math.floor(hash(x,y,20+step)*motifs.length);
        const tint=smooth((p*7+13-rank)/5);
        for(let k=0;k<6;k+=2) {
          path([0,1].map(n=>[cx+lerp(motifs[from][k+n][0],motifs[to][k+n][0],f),cy+lerp(motifs[from][k+n][1],motifs[to][k+n][1],f)]),colour(tint),1.1);
        }
      }
    }
    return marks;
  }
  function draw() {
    if (!context) return;
    context.setTransform(2,0,0,2,0,0);
    context.clearRect(0,0,252,252);
    context.fillStyle=ink.black; context.fillRect(0,0,252,252);
    context.save(); context.beginPath(); context.rect(0,0,252,252); context.clip();
    context.lineCap='butt'; context.lineJoin='miter';
    for(const m of makeArt(design,phase)) {
      context.globalAlpha=m.alpha; context.fillStyle=m.c; context.strokeStyle=m.c;
      if(m.type==='rect') context.fillRect(m.x,m.y,m.w,m.h);
      else if(m.type==='path') {
        context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
        context.lineWidth=m.w; context.stroke();
      } else if(m.type==='text') {
        context.save(); context.beginPath(); context.rect(...m.clip); context.clip();
        context.font=`500 ${m.size}px "Noto Sans JP",sans-serif`; context.textAlign='center'; context.textBaseline='alphabetic';
        context.fillText(m.value,m.x,m.y); context.restore();
      }
    }
    context.restore(); context.globalAlpha=1;
  }
  function sample(now) {
    if (!motion) return 1;
    const t=clamp((now-motion.started)/motion.duration);
    phase=t===1?motion.to:lerp(motion.from,motion.to,1-Math.pow(1-t,3));
    return t;
  }
  function tick(now) {
    frame=null;
    if (!root.isConnected) { motion=null; return; }
    const done=sample(now)===1; draw();
    if(done) motion=null; else frame=requestAnimationFrame(tick);
  }
  function animate() {
    sample(performance.now());
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null; motion=null;
    if(!state.motion || preference?.matches || Math.abs(phase-count)<.00001) { phase=count; draw(); return; }
    motion={from:phase,to:count,started:performance.now(),duration:Math.min(700,state.duration*Math.max(1,Math.sqrt(Math.abs(count-phase))))};
    frame=requestAnimationFrame(tick);
  }
  function restStatus() { status.textContent=count?'READY TO UNLOCK':'TYPE TO ACTIVATE'; }
  function endPreview() { if(previewTimer!==null) clearTimeout(previewTimer); previewTimer=null; delete screen.dataset.unlock; }
  function consumeInput() {
    const length=Math.min(pass.value.length,64);
    const start=Math.min(pass.selectionStart??length,length), end=Math.min(pass.selectionEnd??start,length);
    // Replace entered characters immediately. No storage, password-derived seed or network.
    pass.value='x'.repeat(length); pass.setSelectionRange(start,end);
    const changed=length!==count; count=length;
    endPreview(); if(changed) animate(); restStatus();
  }
  pass.addEventListener('compositionstart',()=>{composing=true;compositionEcho=false;});
  pass.addEventListener('compositionend',()=>{composing=false;consumeInput();compositionEcho=true;});
  pass.addEventListener('input',event=>{
    if(composing || event.isComposing) return;
    if(compositionEcho) { compositionEcho=false; if(event.inputType==='insertCompositionText'||event.inputType==='insertFromComposition') return; }
    consumeInput();
  });
  pass.addEventListener('keydown',event=>{
    if(event.key==='Enter' && !event.isComposing && !composing) {event.preventDefault();unlock.click();}
  });
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.design; if(!designs[next]) return;
    sample(performance.now()); design=next; endPreview();
    screen.dataset.design=design;
    root.querySelector('.tr-bay-head span:first-child').textContent=design==='e'?'東亜重工':'継衛';
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    description.textContent=`${design.toUpperCase()} · ${designs[design].detail}`;
    canvas.setAttribute('aria-label',`${designs[design].name}. A square mechanical pattern that reacts to the length of the dummy input.`);
    draw();
  }));
  unlock.addEventListener('click',()=>{
    if(!count) {status.textContent='ENTER DUMMY TEXT FIRST'; pass.focus(); return;}
    endPreview(); screen.dataset.unlock='true'; status.textContent='PREVIEW ONLY';
    previewTimer=setTimeout(()=>{delete screen.dataset.unlock;previewTimer=null;restStatus();},1100);
  });
  function closeModal() { modal.hidden=true; inertTargets.forEach(el=>el.inert=false); lastFocus?.focus(); }
  root.querySelectorAll('[data-power]').forEach(button=>button.addEventListener('click',()=>{
    endPreview(); lastFocus=button;
    root.querySelector('#tr-dialog-title').textContent=button.dataset.power==='restart'?'Restart?':'Shut down?';
    modal.hidden=false; inertTargets.forEach(el=>el.inert=true); back.focus();
  }));
  back.addEventListener('click',closeModal);
  modal.addEventListener('keydown',event=>{
    if(event.key==='Escape') {event.preventDefault();closeModal();}
    else if(event.key==='Tab') {event.preventDefault();back.focus();}
  });
  function render() {
    screen.dataset.motion=state.motion&&!preference?.matches?'on':'off';
    animate();
  }
  preference?.addEventListener?.('change',render);
  render();
  // First render does not wait for an optional design-control or font service.
  document.fonts?.ready.then(()=>{if(root.isConnected)draw();});
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:screen,onChange:render});
    tweak.addSlider(state,'duration',{label:'Input transition',min:80,max:350,step:10,unit:'ms'});
    tweak.addSlider(state,'red',{label:'Red emphasis',min:65,max:100,step:5,unit:'%'});
    tweak.addToggle(state,'motion',{label:'Input animation'});
  }
})();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"b\"]"}], "remove": ["button[data-design]"], "controls": false});
