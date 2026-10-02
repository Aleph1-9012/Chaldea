
(() => {
  const root = document.getElementById('ts-mechanical-lock-studies');
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
    g: {name:'Die-cut assembly', detail:'Unequal die-cut pieces seat into a single mark. Backspace loosens the assembly.'},
    h: {name:'Registration proof', detail:'Offset copies of 東亜重工 approach alignment along both axes, like separate printing passes.'},
    i: {name:'Punch record', detail:'Narrow slots are punched in scattered banks while the carriage steps between them.'},
    j: {name:'Pressure print', detail:'Small ink fragments press into a dense field around a fixed negative-space 704.'}
  };
  const state = { motion:true, duration:100, red:100 };
  const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let design = 'g', count = 0, phase = 0, motion = null, frame = null;
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
    const text=(value,x,y,size,c,clip,family='Noto Sans JP')=>marks.push({type:'text',value,x,y,size,c,clip,family,alpha:1});
    const polygon=(points,c,alpha=1)=>marks.push({type:'polygon',points,c,alpha});
    if(kind==='g') {
      const pieces=[
        [[8,8],[118,8],[118,34],[86,34],[86,62],[34,62],[34,96],[8,96]],
        [[128,8],[244,8],[244,78],[218,78],[218,34],[162,34],[162,60],[128,60]],
        [[8,106],[34,106],[34,72],[74,72],[74,126],[60,126],[60,170],[8,170]],
        [[172,44],[208,44],[208,88],[244,88],[244,156],[216,156],[216,116],[172,116]],
        [[84,72],[152,72],[152,126],[198,126],[198,164],[160,164],[160,148],[100,148],[100,128],[84,128]],
        [[8,180],[70,180],[70,138],[90,138],[90,158],[116,158],[116,196],[88,196],[88,244],[8,244]],
        [[100,206],[128,206],[128,158],[150,158],[150,182],[204,182],[204,244],[100,244]],
        [[218,166],[244,166],[244,244],[214,244],[214,214],[226,214],[226,190],[218,190]]
      ];
      pieces.forEach((points,i)=>{
        const seat=smooth((p-i*.9)/4);
        const shift=(i%2?1:-1)*(1-seat)*5+Math.sin(p*.6+i)*.7*seat;
        const dx=i%3===0?shift:0,dy=i%3!==0?shift:0;
        const moved=points.map(([x,y])=>[x+dx,y+dy]);
        const tint=smooth((p*.6+1-(i*5)%8)/2);
        path([...points,points[0]],ink.dark,.8);
        polygon(moved,tint>.3?'#1d1011':'#121211');
        path([...moved,moved[0]],colour(tint),1.2);
        // Fine engravings belong to the part and move with it.
        for(let row=0;row<14;row++) for(let col=0;col<14;col++) {
          const x=12+col*17+dx,y=12+row*17+dy;
          const a=hash(col,row,i)>.5;
          const points=a?[[x,y+3],[x+7,y+3],[x+7,y+9]]:[[x+3,y],[x+3,y+7],[x+9,y+7]];
          marks.push({type:'path',points,c:tint>.5?'#934146':'#57554f',w:.65,alpha:.85,clipPoly:moved});
        }
      });
    } else if(kind==='h') {
      const chars=['東','亜','重','工'];
      chars.forEach((value,i)=>{
        const x=67+(i%2)*118,y=116+Math.floor(i/2)*118;
        const aligned=smooth((p-i*1.7)/14);
        const dx=(i%2?1:-1)*(13*(1-aligned)+Math.sin(p*.4+i)*1.3);
        const dy=(i<2?1:-1)*(8*(1-aligned)+Math.cos(p*.35+i)*1.1);
        const clip=[8,8,236,236];
        marks.push({type:'text-outline',value,x:x-dx*.7,y:y-dy*.7,size:109,c:'#928c80',clip,w:.8,alpha:.68});
        text(value,x+dx,y+dy,109,colour(.92),clip);
        marks.push({type:'text-outline',value,x,y,size:109,c:ink.light,clip,w:.65,alpha:.55});
      });
      // Registration marks remain fixed while both print layers move.
      for(const [x,y,sx,sy] of [[4,4,1,1],[248,4,-1,1],[4,248,1,-1],[248,248,-1,-1]]) {
        path([[x,y+sy*13],[x,y],[x+sx*13,y]],ink.grey,.8);
      }
      path([[121,4],[131,4]],ink.red,1);
      path([[4,121],[4,131]],ink.red,1);
    } else if(kind==='i') {
      const ranks=rankFor(18,9,31);
      path([[7,22],[7,7],[245,7],[245,245],[7,245],[7,38]],ink.grey,.85);
      text('704',49,41,29,ink.light,[8,8,236,236],'JetBrains Mono');
      text('17',225,35,16,ink.red,[8,8,236,236],'JetBrains Mono');
      for(let n=0;n<17;n++) {
        const w=hash(n,0,41)>.5?2.8:1;
        rect(96+n*5,18,w,21,n%4===0?ink.red:ink.grey);
      }
      for(let y=0;y<9;y++) {
        text(String(y+1).padStart(2,'0'),18,70+y*20,11,ink.grey,[8,46,236,190],'JetBrains Mono');
        for(let x=0;x<18;x++) {
          const rank=ranks[y*18+x],px=35+x*11.4,py=58+y*20;
          const punched=smooth((p*2+12-rank)/1.8);
          rect(px,py,3.4,12,'#2a2925');
          rect(px,py+12*(1-punched),3.4,12*punched,colour(1));
        }
      }
      const n=clamp(p*2+12,0,160),a=Math.floor(n),b=a+1,f=n-a;
      const ia=ranks.indexOf(a),ib=ranks.indexOf(b);
      const ax=35+(ia%18)*11.4,ay=58+Math.floor(ia/18)*20;
      const bx=35+(ib%18)*11.4,by=58+Math.floor(ib/18)*20;
      const x=lerp(ax,bx,smooth(f*2)),y=lerp(ay,by,smooth(f*2-1));
      path([[x-3,y+4],[x-3,y-3],[x+3,y-3]],ink.light,.9);
      path([[x+.4,y+15],[x+6.4,y+15],[x+6.4,y+8]],ink.light,.9);
    } else if(kind==='j') {
      const ranks=rankFor(40,40,27);
      for(let y=0;y<40;y++) for(let x=0;x<40;x++) {
        const rank=ranks[y*40+x];
        const inked=smooth((p*19+180-rank)/30);
        const pulse=(Math.sin(p*.72+hash(x,y,18)*6.28)+1)/2;
        const px=7+x*6,py=7+y*6;
        const width=3.3+hash(x,y,6)*2.3;
        const height=2+hash(x,y,8)*2.5;
        const vertical=hash(x,y,9)>.82;
        const blend=inked*state.red/100;
        const c=`rgb(${[163,160,147].map((v,i)=>Math.round(lerp(v,[209,22,28][i],blend))).join(',')})`;
        if(vertical) rect(px+.8,py+.4*pulse,height,width,c,.9);
        else rect(px+.4*pulse,py,width,height*(.85+.15*pulse),c,.9);
      }
      // A fixed knockout keeps the identifier legible while the surrounding ink changes.
      text('704',126,163,100,ink.black,[0,0,252,252],'JetBrains Mono');
      marks.push({type:'text-outline',value:'704',x:126,y:163,size:100,c:ink.black,clip:[0,0,252,252],family:'JetBrains Mono',w:1.5,alpha:1});
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
      context.save();
      if(m.clipPoly) {
        context.beginPath(); m.clipPoly.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y)); context.closePath(); context.clip();
      }
      context.globalAlpha=m.alpha; context.fillStyle=m.c; context.strokeStyle=m.c;
      if(m.type==='rect') context.fillRect(m.x,m.y,m.w,m.h);
      else if(m.type==='path') {
        context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
        context.lineWidth=m.w; context.stroke();
      } else if(m.type==='polygon') {
        context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y)); context.closePath(); context.fill();
      } else if(m.type==='text'||m.type==='text-outline') {
        context.save(); context.beginPath(); context.rect(...m.clip); context.clip();
        context.font=`500 ${m.size}px "${m.family||'Noto Sans JP'}",sans-serif`; context.textAlign='center'; context.textBaseline='alphabetic';
        if(m.type==='text-outline') {context.lineWidth=m.w;context.strokeText(m.value,m.x,m.y);} else context.fillText(m.value,m.x,m.y);
        context.restore();
      }
      context.restore();
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
    root.querySelector('.tr-bay-head span:first-child').textContent='継衛';
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


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"g\"]"}], "remove": ["button[data-design]"], "controls": false});
