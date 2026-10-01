

(() => {
  const root=document.getElementById('ts-folio-k-time-header');if(!root)return;
  const screen=root.querySelector('.rl-screen'),canvas=root.querySelector('.rl-art'),context=canvas.getContext('2d');
  const pass=root.querySelector('#ft-demo-input'),status=root.querySelector('.rl-status');
  const modal=root.querySelector('.rl-modal'),back=root.querySelector('.rl-back'),unlock=root.querySelector('.rl-login');
  const inertTargets=['.rl-header','.rl-main','.rl-footer'].map(s=>root.querySelector(s));
  const state={motion:true,duration:100,red:100};
  const identity=root.querySelector('.rl-identity');
  const identityStyle={treatment:'register'};
  function renderIdentity() { identity.dataset.identity=identityStyle.treatment; }
  const clockStrip=root.querySelector('.rl-clock-block');
  const clockStyle={treatment:'split'};
  function renderClock() { clockStrip.dataset.clock=clockStyle.treatment; }
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  const design='k';
  let count=0,phase=0,motion=null,frame=null;
  let composing=false,compositionEcho=false,previewTimer=null,lastFocus=null;
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
  function colour(t) {
    t=clamp(t*state.red/100);
    const a=[104,102,94], b=[209,22,28];
    return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;
  }

  function makeArt(kind,p) {
    const marks=[];
    const path=(points,c=ink.grey,w=1,alpha=1)=>marks.push({type:'path',points,c,w,alpha});
    const transform=(points,cx,cy,angle)=>points.map(([x,y])=>[cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)]);
    if(kind==='k') {
      function glyph(cx,cy,size,key,depth,alpha) {
        if(alpha<.004)return;
        const a=Math.floor(hash(key,depth,27)*4)*Math.PI/2;
        const bend=(hash(key,depth,17)-.5)*.26;
        const local=Math.sin(p*.24+key)*.075;
        const shape=[
          [[-.35,-.4],[-.35,.34],[-.14,.34]],
          [[-.35,-.13],[.31,-.13],[.31,.12]],
          [[.02+bend,-.39],[.02+bend,.34]],
          [[-.12,.12+local],[.35,.12+local],[.35,.39]],
          [[-.4,-.39],[-.2,-.39]],
          [[.22,-.4],[.4,-.4],[.4,-.25]]
        ];
        const tint=smooth((p*.012+.23-hash(key,depth,61))/.2);
        shape.forEach(points=>path(transform(points.map(([x,y])=>[x*size,y*size]),cx,cy,a),colour(tint),Math.max(.75,size*.031),alpha));
      }
      function branch(cx,cy,size,key,depth,threshold,alpha) {
        const split=depth<3?smooth((p-threshold)/2.2):0;
        glyph(cx,cy,size,key,depth,alpha*(1-split));
        if(split>0)for(let child=0;child<4;child++) {
          const childKey=key*5+child+1;
          const x=cx+(child%2?1:-1)*size*.25*split;
          const y=cy+(child<2?-1:1)*size*.25*split;
          const next=depth===0?-2+hash(childKey,depth,7)*25:threshold+6+hash(childKey,depth,7)*16;
          branch(x,y,size*.5,childKey,depth+1,next,alpha*split);
        }
      }
      for(let y=0;y<3;y++)for(let x=0;x<3;x++)branch(48+x*78,48+y*78,78,y*3+x+1,0,-4,1);

    }
    return marks;
  }

  function draw() {
    if(!context)return;
    const side=Math.max(1,Math.round((canvas.getBoundingClientRect().width||252)*Math.min(globalThis.devicePixelRatio||1,2)));
    if(canvas.width!==side || canvas.height!==side){canvas.width=side;canvas.height=side;}
    context.setTransform(side/252,0,0,side/252,0,0);
    context.clearRect(0,0,252,252);
    context.save();context.beginPath();context.rect(0,0,252,252);context.clip();
    context.lineCap='butt';context.lineJoin='miter';
    for(const m of makeArt(design,phase)) {
      context.globalAlpha=m.alpha;context.strokeStyle=m.c;context.fillStyle=m.c;
      if(m.type==='rect')context.fillRect(m.x,m.y,m.w,m.h);
      else { context.beginPath();m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.lineWidth=m.w;context.stroke(); }
    }
    context.restore();context.globalAlpha=1;
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
  function restStatus() { status.textContent=''; }
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
    if(event.key==='Escape' && !composing) {event.preventDefault();pass.value='';consumeInput();}
    if(event.key==='Enter' && !event.isComposing && !composing) {event.preventDefault();unlock.click();}
  });

  unlock.addEventListener('click',()=>{
    if(!count) {status.textContent='USE DUMMY TEXT'; pass.focus(); return;}
    endPreview(); screen.dataset.unlock='true'; status.textContent='PREVIEW ONLY';
    previewTimer=setTimeout(()=>{delete screen.dataset.unlock;previewTimer=null;restStatus();},1100);
  });
  function closeModal() { modal.hidden=true; inertTargets.forEach(el=>el.inert=false); lastFocus?.focus(); }
  root.querySelectorAll('[data-power]').forEach(button=>button.addEventListener('click',()=>{
    endPreview(); lastFocus=button;
    root.querySelector('#ft-dialog-title').textContent=button.dataset.power==='restart'?'Restart?':'Shut down?';
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
  renderIdentity();
  renderClock();
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}draw();});
    observer.observe(canvas);
  }
  // First render does not wait for an optional design-control or font service.
  document.fonts?.ready.then(()=>{if(root.isConnected)draw();});
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:screen,onChange:render});
    tweak.addSlider(state,'duration',{label:'Input transition',min:80,max:350,step:10,unit:'ms'});
    tweak.addToggle(state,'motion',{label:'Input animation'});
    const nameTweak=new Tweak({container:identity,onChange:renderIdentity});
    nameTweak.addSelect(identityStyle,'treatment',{label:'Username style',options:[{label:'Register header',value:'register'},{label:'Red rail',value:'rail'},{label:'Stamped plate',value:'plate'}]});
    const clockTweak=new Tweak({container:clockStrip,onChange:renderClock});
    clockTweak.addSelect(clockStyle,'treatment',{label:'Clock style',options:[{label:'Split register',value:'split'},{label:'Red date tab',value:'date-tab'},{label:'Centered stack',value:'stack'}]});
  }


})();



window.XLR8Archive.finish({"controls": false});
