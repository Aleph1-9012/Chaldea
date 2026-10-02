
(() => {
  const root = document.getElementById('ts-generative-lock-studies');
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
    k: {name:'Compound glyph',detail:'Large abstract glyphs divide into smaller nested glyphs, then merge again on Backspace.'},
    l: {name:'Crossweave',detail:'Stepped strands change their detours and over-under crossings as the drawing reconfigures.'},
    m: {name:'Folded lattice',detail:'An open wireframe structure turns through depth while its inner layers shift against each other.'}
  };
  const state = { motion:true, duration:100, red:100 };
  const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let design = 'k', count = 0, phase = 0, motion = null, frame = null;
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
  const ink = {black:'#090909'};
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
    } else if(kind==='l') {
      const strands=[];
      for(let family=0;family<2;family++)for(let lane=0;lane<9;lane++) {
        const points=[],base=20+lane*26;
        const power=smooth((p*.15+2.2-((lane*5+family*3)%9))/1.5);
        function point(u,v){return family?[v,u]:[u,v];}
        points.push(point(6,base));
        for(let cell=0;cell<6;cell++) {
          const u=14+cell*38;
          const offset=(hash(lane,cell,family+3)>.5?1:-1)*(3+9*smooth((1+Math.sin(p*.6+lane*.7+cell))/2));
          const slide=5*Math.sin(p*.5+lane+cell*1.7);
          points.push(point(u+slide,base),point(u+slide,base+offset),point(u+21+slide,base+offset),point(u+21+slide,base));
        }
        points.push(point(246,base));
        strands.push({points,family,lane,c:colour(power)});
      }
      // Two outlines give each strand a ribbon edge instead of a travelling trace.
      function ribbon(strand,points=strand.points,cut=false) {
        if(cut)path(points,ink.black,5.4);
        path(points,strand.c,.95);
        path(points.map(([x,y])=>strand.family?[x+2.7,y]:[x,y+2.7]),strand.c,.65,.68);
      }
      strands.filter(s=>s.family===0).forEach(s=>ribbon(s));
      strands.filter(s=>s.family===1).forEach(s=>ribbon(s,s.points,true));
      // Alternate overpasses at actual perpendicular segment intersections.
      for(const h of strands.filter(s=>!s.family))for(const v of strands.filter(s=>s.family)) {
        if((h.lane+v.lane)%2)continue;
        for(let a=0;a<h.points.length-1;a++)for(let b=0;b<v.points.length-1;b++) {
          const [a0,a1]=[h.points[a],h.points[a+1]], [b0,b1]=[v.points[b],v.points[b+1]];
          if(a0[1]!==a1[1]||b0[0]!==b1[0])continue;
          const x=b0[0],y=a0[1];
          if(x>Math.min(a0[0],a1[0])+3&&x<Math.max(a0[0],a1[0])-3&&y>Math.min(b0[1],b1[1])&&y<Math.max(b0[1],b1[1]))ribbon(h,[[x-3.5,y],[x+3.5,y]],true);
        }
      }
    } else if(kind==='m') {
      const segments=[],seen=new Set();
      const levels=[-1,-1/3,1/3,1];
      function edge(a,b,key) {
        const id=[a.join(','),b.join(',')].sort().join('|');
        if(seen.has(id))return;seen.add(id);segments.push({a,b,key});
      }
      for(let z=0;z<3;z++)for(let y=0;y<3;y++)for(let x=0;x<3;x++) {
        if([x,y,z].filter(v=>v===1).length>1)continue;
        const corners=[];
        for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)corners.push([levels[x+dx],levels[y+dy],levels[z+dz]]);
        for(let v=0;v<8;v++)for(const bit of [1,2,4])if(!(v&bit))edge(corners[v],corners[v|bit],x+y*3+z*9);
      }
      // Internal combs are free to shift independently of the outer frame.
      for(let plane=0;plane<3;plane++)for(let step=0;step<9;step++) {
        const u=-.86+step*.215,z=(plane-1)*.59+Math.sin(p*.2+plane)*.075;
        segments.push({a:[u,-.86,z],b:[u,.86,z],key:31+plane*9+step,inner:true});
        segments.push({a:[-.86,u,z],b:[.86,u,z],key:45+plane*9+step,inner:true});
      }
      const yaw=.62+p*.034,tilt=-.47+Math.sin(p*.085)*.15;
      function project([x,y,z]) {
        const ax=x*Math.cos(yaw)+z*Math.sin(yaw),az=-x*Math.sin(yaw)+z*Math.cos(yaw);
        const by=y*Math.cos(tilt)-az*Math.sin(tilt),bz=y*Math.sin(tilt)+az*Math.cos(tilt);
        return [126+ax*71,126+by*71,bz];
      }
      const ordered=segments.map(s=>({...s,a:project(s.a),b:project(s.b)})).sort((a,b)=>(a.a[2]+a.b[2])-(b.a[2]+b.b[2]));
      ordered.forEach(s=>{
        const depth=(s.a[2]+s.b[2])/2;
        const tint=smooth((p*.12+4-(s.key*7)%23)/2.5);
        const light=Math.round(70+clamp((depth+1.5)/3)*96);
        const c=tint>.02?colour(tint):`rgb(${light},${light-3},${light-11})`;
        path([s.a.slice(0,2),s.b.slice(0,2)],c,s.inner?.7:1.05,s.inner?.48:.88);
      });
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
      context.globalAlpha=m.alpha; context.strokeStyle=m.c;
      context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
      context.lineWidth=m.w; context.stroke();
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
  // First render does not depend on the optional design-control helper.
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:screen,onChange:render});
    tweak.addSlider(state,'duration',{label:'Input transition',min:80,max:350,step:10,unit:'ms'});
    tweak.addSlider(state,'red',{label:'Red emphasis',min:65,max:100,step:5,unit:'%'});
    tweak.addToggle(state,'motion',{label:'Input animation'});
  }
})();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"m\"]"}], "remove": ["button[data-design]"], "controls": false});
