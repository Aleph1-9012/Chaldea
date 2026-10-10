(() => {
  const root = document.getElementById('ts-reactive-lock-studies');
  if (!root) return;
  const screen = root.querySelector('.tr-screen');
  const canvas = root.querySelector('.tr-art');
  const context = canvas.getContext('2d');
  const pass = root.querySelector('#tr-study-pass');
  const status = root.querySelector('.tr-status');
  const modal = root.querySelector('.tr-modal');
  const back = root.querySelector('.tr-back');
  const unlock = root.querySelector('.tr-unlock');
  const inertTargets = ['.tr-header','.tr-main','.tr-footer'].map(s => root.querySelector(s));
  const state = { motion:true, duration:100, red:100 };
  const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let count = 0, phase = 0, motion = null, frame = null;
  let composing = false, compositionEcho = false, previewTimer = null, lastFocus = null;
  const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
  const lerp = (a,b,t) => a+(b-a)*t;

  function draw() {
    if (!context) return;
    context.setTransform(2,0,0,2,0,0);
    context.clearRect(0,0,252,252);
    context.fillStyle='#090909'; context.fillRect(0,0,252,252);
    context.save(); context.beginPath(); context.rect(0,0,252,252); context.clip();
    context.lineCap='butt'; context.lineJoin='miter';
    for(const m of glyphMarks(phase,state.red)) {
      context.globalAlpha=m.alpha; context.fillStyle=m.c; context.strokeStyle=m.c;
      if(m.type==='rect') context.fillRect(m.x,m.y,m.w,m.h);
      else if(m.type==='path') {
        context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
        context.lineWidth=m.w; context.stroke();
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
  // Redraw when the local font is ready.
  document.fonts?.ready.then(()=>{if(root.isConnected)draw();});
  window.ChaldeaPreview.connect(settings => {
    state.duration = settings.s0Duration;
    state.motion = settings.s2Motion;
    state.red = settings.s1Red;
    render();
  });
})();
