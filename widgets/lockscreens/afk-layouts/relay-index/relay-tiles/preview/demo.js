(() => {
  const root=document.getElementById('ts-lock-afk-layouts');if(!root)return;
  const screen=root.querySelector('.rl-screen'),canvas=root.querySelector('.rl-art'),context=canvas.getContext('2d');
  const pass=root.querySelector('#afk-demo-input'),status=root.querySelector('.rl-status');
  const modal=root.querySelector('.rl-modal'),back=root.querySelector('.rl-back'),unlock=root.querySelector('.rl-login');
  const inertTargets=['.rl-header','.rl-main','.rl-footer'].map(s=>root.querySelector(s));
  const state={motion:true,duration:180};
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let count=12,phase=12,motion=null,frame=null;
  let composing=false,compositionEcho=false,previewTimer=null,lastFocus=null;
  const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
  const lerp = (a,b,t) => a+(b-a)*t;

  function draw() {
    if(!context||!root.isConnected)return;
    const side=Math.max(1,Math.round((canvas.getBoundingClientRect().width||252)*Math.min(globalThis.devicePixelRatio||1,2)));
    if(canvas.width!==side || canvas.height!==side){canvas.width=side;canvas.height=side;}
    context.setTransform(side/252,0,0,side/252,0,0);
    context.clearRect(0,0,252,252);
    context.save();context.beginPath();context.rect(0,0,252,252);context.clip();
    context.lineCap='butt';context.lineJoin='miter';
    for(const m of glyphMarks(phase,100)) {
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
    root.querySelector('#afk-dialog-title').textContent=button.dataset.power==='restart'?'Restart?':'Shut down?';
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
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}draw();});
    observer.observe(canvas);
  }
  // Redraw when the local font is ready.
  document.fonts?.ready.then(()=>{if(root.isConnected)draw();});
  window.ChaldeaPreview.connect(settings => {
    state.duration = settings.s0Duration;
    state.motion = settings.s1Motion;
    render();
  });
})();
