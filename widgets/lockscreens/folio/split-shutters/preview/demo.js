

(() => {
  const root=document.getElementById('ts-folio-k-password-motion');if(!root)return;
  const screen=root.querySelector('.rl-screen'),canvas=root.querySelector('.rl-art'),context=canvas.getContext('2d');
  const pass=root.querySelector('#pm-demo-input'),status=root.querySelector('.rl-status');
  const modal=root.querySelector('.rl-modal'),back=root.querySelector('.rl-back'),unlock=root.querySelector('.rl-login');
  const inertTargets=['.rl-header','.rl-main','.rl-footer'].map(s=>root.querySelector(s));
  const state={motion:true,duration:100,red:100};
  const identity=root.querySelector('.rl-identity');
  const identityStyle={treatment:'register'};
  function renderIdentity() { identity.dataset.identity=identityStyle.treatment; }
  const clockStrip=root.querySelector('.rl-clock-block');
  const clockStyle={treatment:'split'};
  function renderClock() { clockStrip.dataset.clock=clockStyle.treatment; }
  const prompt=root.querySelector('.rl-auth'),promptStyle={treatment:'bay'};
  function renderPrompt() { prompt.dataset.prompt=promptStyle.treatment; }
  const overlay=root.querySelector('.rl-transition'),transitionContext=overlay.getContext('2d');
  const exitMessage=root.querySelector('.rl-exit-message'),demoStatus=root.querySelector('.rl-demo-status');
  const replayLock=root.querySelector('[data-replay="lock"]'),replayUnlock=root.querySelector('[data-replay="unlock"]');
  const effectStyle={kind:'folio',duration:1100};
  let sequence=null,sequenceFrame=null,screenMode='locked',capsLock=false;
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  const design='k';
  let count=0,phase=0,motion=null,frame=null;
  let composing=false,compositionEcho=false,lastFocus=null;
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
  // Flat masks replace the video wave. No idle animation or external assets.
  function transitionArt(kind,direction,t,width,height) {
    const entering=direction==='lock',marks=[];
    const ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
    const rect=(x,y,w,h,c,alpha=1)=>{if(w>0&&h>0&&alpha>0)marks.push({x,y,w,h,c,alpha});};
    let scene=1;
    if(kind==='folio') {
      const split=width>670?.37:0;
      if(entering) {
        scene=clamp((t-.43)/.25);
        if(t<.4) rect(-width+width*ease(t/.4),0,width,height,'#d1161c');
        else rect(0,0,width*(1-(1-split)*ease((t-.48)/.48)),height,'#d1161c');
      } else {
        scene=t<.48?1:0;
        if(t<.5) rect(0,0,width*(split+(1-split)*ease(t/.46)),height,'#d1161c');
        else rect(width*ease((t-.56)/.44),0,width,height,'#d1161c');
      }
    } else if(kind==='shutters') {
      const amount=entering?1-ease((t-.12)/.8):ease(t/.8);
      const h=height*.5*amount;
      rect(0,0,width,h,'#090909');rect(0,height-h,width,h,'#090909');
      if(h>0&&h<height*.5-.1) {
        rect(0,h-1,width,1,'#d1161c');rect(0,height-h,width,1,'#d1161c');
      } else if(h>=height*.5-.1) {
        const alpha=entering?clamp(t/.1):1-clamp((t-.88)/.12);
        rect(width*.12,height*.5-1,width*.76,2,'#d1161c',alpha);
      }
      if(!entering&&t>=.8)scene=0;
    } else {
      const bandHeight=height/6;
      for(let i=0;i<6;i++) {
        const order=entering?i:5-i,local=ease((t-order*.045)/.775),sign=i%2?-1:1;
        const x=sign*width*(entering?local:1-local);
        rect(x,i*bandHeight,width,bandHeight+1,'#090909');
        if(local>0&&local<1)rect(sign>0?x:x+width-2,i*bandHeight,2,bandHeight+1,'#d1161c');
      }
      if(!entering&&t===1)scene=0;
    }
    return {scene,marks};
  }
  function paintTransition(progress) {
    if(!sequence||!transitionContext)return;
    const bounds=screen.getBoundingClientRect(),width=Math.max(1,bounds.width),height=Math.max(1,bounds.height);
    const dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.round(width*dpr),h=Math.round(height*dpr);
    if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}
    transitionContext.setTransform(dpr,0,0,dpr,0,0);
    transitionContext.clearRect(0,0,width,height);
    const recipe=transitionArt(sequence.kind,sequence.direction,clamp(progress),width,height);
    screen.style.setProperty('--rl-scene-alpha',String(recipe.scene));
    for(const mark of recipe.marks){transitionContext.fillStyle=mark.c;transitionContext.globalAlpha=mark.alpha;transitionContext.fillRect(mark.x,mark.y,mark.w,mark.h);}
    transitionContext.globalAlpha=1;
  }
  function finishTransition(direction,focus=true) {
    if(sequenceFrame!==null)cancelAnimationFrame(sequenceFrame);
    sequenceFrame=null;sequence=null;
    const locked=direction==='lock';screenMode=locked?'locked':'unlocked';
    screen.style.setProperty('--rl-scene-alpha',locked?'1':'0');
    overlay.hidden=true;exitMessage.hidden=locked;
    inertTargets.forEach(el=>el.inert=!locked);pass.disabled=!locked;unlock.disabled=!locked;
    demoStatus.textContent=locked?'Lock preview.':'Unlock preview. No system action.';
    if(focus){if(locked)pass.focus();else replayLock.focus();}
  }
  function stepTransition(now) {
    sequenceFrame=null;
    if(!root.isConnected){sequence=null;return;}
    if(!sequence)return;
    const progress=clamp((now-sequence.started)/sequence.duration);
    paintTransition(progress);
    if(progress===1)finishTransition(sequence.direction);else sequenceFrame=requestAnimationFrame(stepTransition);
  }
  function endPreview() { if(sequence||screenMode!=='locked')finishTransition('lock',false); }
  function playTransition(direction) {
    endPreview();
    if(!modal.hidden)closeModal();
    restStatus();exitMessage.hidden=true;
    if(!state.motion||preference?.matches||!transitionContext){finishTransition(direction);return;}
    sequence={direction,kind:effectStyle.kind,duration:effectStyle.duration,started:performance.now()};
    inertTargets.forEach(el=>el.inert=true);pass.disabled=true;unlock.disabled=true;
    overlay.hidden=false;paintTransition(0);sequenceFrame=requestAnimationFrame(stepTransition);
  }
  function restStatus() { status.textContent=capsLock?'CAPS LOCK':''; }
  function updateCaps(event) { if(typeof event.getModifierState==='function'){capsLock=event.getModifierState('CapsLock');restStatus();} }
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
    updateCaps(event);
    if(event.key==='Escape' && !composing) {event.preventDefault();pass.value='';consumeInput();}
    if(event.key==='Enter' && !event.isComposing && !composing) {event.preventDefault();unlock.click();}
  });
  pass.addEventListener('keyup',updateCaps);
  replayLock.addEventListener('click',()=>playTransition('lock'));
  replayUnlock.addEventListener('click',()=>playTransition('unlock'));

  unlock.addEventListener('click',()=>{
    if(!count) {status.textContent='USE DUMMY TEXT'; pass.focus(); return;}
    playTransition('unlock');
  });
  function closeModal() { modal.hidden=true; inertTargets.forEach(el=>el.inert=false); lastFocus?.focus(); }
  root.querySelectorAll('[data-power]').forEach(button=>button.addEventListener('click',()=>{
    endPreview(); lastFocus=button;
    root.querySelector('#pm-dialog-title').textContent=button.dataset.power==='restart'?'Restart?':'Shut down?';
    modal.hidden=false; inertTargets.forEach(el=>el.inert=true); back.focus();
  }));
  back.addEventListener('click',closeModal);
  modal.addEventListener('keydown',event=>{
    if(event.key==='Escape') {event.preventDefault();closeModal();}
    else if(event.key==='Tab') {event.preventDefault();back.focus();}
  });
  function render() {
    screen.dataset.motion=state.motion&&!preference?.matches?'on':'off';
    if(sequence&&(!state.motion||preference?.matches))finishTransition(sequence.direction,false);
    animate();
  }
  preference?.addEventListener?.('change',render);
  render();
  renderIdentity();
  renderClock();
  renderPrompt();
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}draw();if(sequence)paintTransition((performance.now()-sequence.started)/sequence.duration);});
    observer.observe(canvas);
    observer.observe(screen);
  }
  // First render does not wait for an optional design-control or font service.
  document.fonts?.ready.then(()=>{if(root.isConnected)draw();});
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:screen,onChange:render});
    tweak.addSlider(state,'duration',{label:'Input transition',min:80,max:350,step:10,unit:'ms'});
    tweak.addToggle(state,'motion',{label:'Animations'});
    tweak.addSelect(effectStyle,'kind',{label:'Lock/unlock animation',options:[{label:'Folio sweep',value:'folio'},{label:'Split shutters',value:'shutters'},{label:'Register bands',value:'bands'}]});
    tweak.addSlider(effectStyle,'duration',{label:'Lock/unlock time',min:600,max:1800,step:50,unit:'ms'});
    const nameTweak=new Tweak({container:identity,onChange:renderIdentity});
    nameTweak.addSelect(identityStyle,'treatment',{label:'Username style',options:[{label:'Register header',value:'register'},{label:'Red rail',value:'rail'},{label:'Stamped plate',value:'plate'}]});
    const clockTweak=new Tweak({container:clockStrip,onChange:renderClock});
    clockTweak.addSelect(clockStyle,'treatment',{label:'Clock style',options:[{label:'Split register',value:'split'},{label:'Red date tab',value:'date-tab'},{label:'Centered stack',value:'stack'}]});
    const promptTweak=new Tweak({container:prompt,onChange:renderPrompt});
    promptTweak.addSelect(promptStyle,'treatment',{label:'Password field',options:[{label:'Inset bay',value:'bay'},{label:'Open bracket',value:'bracket'},{label:'Red plate',value:'plate'}]});
  }


})();



window.XLR8Archive.finish({"fixed": {"Lock/unlock animation": "Split shutters"}, "controls": false});
