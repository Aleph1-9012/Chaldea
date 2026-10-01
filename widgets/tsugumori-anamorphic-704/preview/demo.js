// SPDX-License-Identifier: 0BSD
(() => {
function makeAnamorphic() {
  const ink = '#e8e4d8', accent = '#cc1515';
  const alignment = 24;
  let angle = 30, target = 30, dragging = false, startX = 0, startAngle = 0;
  let width = 688, height = 410, event = 'Drag to find the reading angle';
  const outerZero = [[.09,0],[.64,0],[.75,.12],[.75,.88],[.64,1],[.09,1],[0,.88],[0,.12]];
  const innerZero = [[.21,.20],[.54,.20],[.54,.80],[.21,.80]];
  const shapes = [
    { x: 0, rings: [[[0,0],[.72,0],[.72,.17],[.29,1],[.055,1],[.47,.20],[0,.20]]] },
    { x: .86, rings: [outerZero, innerZero] },
    { x: 1.77, rings: [[[.40,0],[.65,0],[.65,.61],[.79,.61],[.79,.81],[.65,.81],[.65,1],[.43,1],[.43,.81],[0,.81],[0,.60]],[[.43,.27],[.205,.61],[.43,.61]]] }
  ];
  const strands = [];
  function inside(x,y,ring) {
    let hit = false;
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[i],b=ring[j];
      if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
    }
    return hit;
  }
  function hash(n) { return (Math.sin(n*127.1+311.7)*43758.5453)%1; }
  let index=0;
  for (let row=0;row<62;row++) {
    const y=(row+.5)/62;
    for (let glyph=0;glyph<shapes.length;glyph++) {
      const shape=shapes[glyph];
      let spanStart=null;
      for (let column=0;column<=158;column++) {
        const x=column*.005;
        const present=column<158 && shape.rings.reduce((value,ring)=>value!==inside(x,y,ring),false);
        if (present && spanStart===null) spanStart=x;
        if (!present && spanStart!==null) {
          const end=x;
          const pieces=Math.max(1,Math.ceil((end-spanStart)/.085));
          for (let p=0;p<pieces;p++) {
            const left=spanStart+(end-spanStart)*p/pieces;
            const right=spanStart+(end-spanStart)*(p+1)/pieces;
            const seed=++index;
            const z=(Math.abs(hash(seed))*2-1)*.82 + Math.sin(row*.23+glyph)*.19;
            strands.push({ a:shape.x+left+0.002, b:shape.x+right-.002, y:y-.5, z, red:seed%37===0, seed });
          }
          spanStart=null;
        }
      }
    }
  }
  function geometry(w,h) {
    const sx=(w-Math.max(36,w*.12))/2.56;
    return { sx, sy:Math.min(h*.63,sx*1.75), cx:w*.5, cy:h*.48 };
  }
  function project(x,y,z,rad,g) {
    const focal=4.9;
    // At the reading angle every depth projects onto its intended glyph.
    const px=(x-1.28)*(focal+z)/focal;
    const py=y*(focal+z)/focal;
    const rx=px*Math.cos(rad)+z*Math.sin(rad);
    const rz=-px*Math.sin(rad)+z*Math.cos(rad);
    const scale=focal/(focal+rz);
    return {x:g.cx+rx*scale*g.sx,y:g.cy+py*scale*g.sy,z:rz};
  }
  function setAngle(value) {
    angle=target=Math.max(-65,Math.min(80,Number(value)||0));
    event=Math.abs(angle-alignment)<.7?'704 aligned at 24°':'Reading angle changed';
  }
  return {
    controls() { return [
      {type:'button',key:'align',label:'Align 704'},
      {type:'range',key:'angle',label:'Angle',min:-65,max:80,step:1,value:Math.round(target)}
    ]; },
    draw(ctx,w,h) {
      width=w;height=h;
      const g=geometry(w,h),rad=(angle-alignment)*Math.PI/180;
      const marks=strands.map(s=>({s,a:project(s.a,s.y,s.z,rad,g),b:project(s.b,s.y,s.z,rad,g)}));
      marks.sort((a,b)=>b.a.z-a.a.z);
      let extentX=0,extentY=0;
      for(const m of marks) for(const p of [m.a,m.b]) {
        extentX=Math.max(extentX,Math.abs(p.x-g.cx));
        extentY=Math.max(extentY,Math.abs(p.y-g.cy));
      }
      const fit=Math.min(1,(w*.5-18)/extentX,(h*.38)/extentY);
      ctx.save();
      ctx.lineCap='butt';
      // Quiet floor ticks make the rotation legible without a dashboard.
      ctx.strokeStyle='#242322';ctx.lineWidth=1;
      const floorY=g.cy+g.sy*.64;
      ctx.beginPath();ctx.moveTo(w*.1,floorY);ctx.lineTo(w*.9,floorY);ctx.stroke();
      for(let i=-3;i<=3;i++) {
        const x=w*.5+i*w*.105;
        ctx.beginPath();ctx.moveTo(x,floorY-3);ctx.lineTo(x,floorY+3);ctx.stroke();
      }
      for (const {s,a,b} of marks) {
        ctx.globalAlpha=s.red?.95:Math.max(.43,Math.min(.98,.75-a.z*.19));
        ctx.strokeStyle=s.red?accent:ink;
        ctx.lineWidth=Math.max(.8,g.sy*.0108*4.9/(4.9+a.z)*fit);
        ctx.beginPath();ctx.moveTo(g.cx+(a.x-g.cx)*fit,g.cy+(a.y-g.cy)*fit);ctx.lineTo(g.cx+(b.x-g.cx)*fit,g.cy+(b.y-g.cy)*fit);ctx.stroke();
      }
      ctx.globalAlpha=1;
      const tickX=w*.5+Math.sin(rad)*w*.19;
      ctx.strokeStyle=accent;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(tickX,floorY-5);ctx.lineTo(tickX,floorY+5);ctx.stroke();
      ctx.restore();
    },
    update(dt) {
      if (!dragging && angle!==target) {
        angle+=(target-angle)*(1-Math.exp(-Math.min(dt,.05)*13));
        if(Math.abs(angle-target)<.02) angle=target;
      }
    },
    pointer(kind,x) {
      if(kind==='down') { dragging=true;startX=x;startAngle=angle;target=angle;event='Rotating the letter strands'; }
      else if(kind==='move'&&dragging) setAngle(startAngle+(x-startX)*150);
      else if(kind==='up'||kind==='leave') {
        if(dragging) event=Math.abs(angle-alignment)<.7?'704 aligned at 24°':'Rotation released';
        dragging=false;
      }
    },
    action(key,value) {
      if(key==='align') { dragging=false;angle=target=alignment;event='704 aligned at 24°'; }
      if(key==='angle') setAngle(value);
    },
    wheel(deltaY) { setAngle(angle+Math.sign(deltaY)*3); },
    suspend() { dragging=false; },
    status() { return event; }
  };
}
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makeAnamorphic();
  const title="ANAMORPHIC 704";
  const hint="Drag to rotate. Find the angle where the marks become 704.";
  let W=0,H=0,time=0,syncTime=0,last=null,raf=0,paused=media.matches,visible=true,captured=false;
  const bindings=new Map(),appearance={compact:false};
  const module=()=>study;
  function makeControl(c){
    let el,box,valueLabel,nameLabel;
    if(c.type==='button'){el=document.createElement('button');el.type='button';box=el;el.addEventListener('click',()=>act(c.key));}
    else{box=document.createElement('label');const label=document.createElement('span');nameLabel=document.createElement('span');nameLabel.textContent=c.label;label.appendChild(nameLabel);valueLabel=document.createElement('output');label.appendChild(valueLabel);box.appendChild(label);el=document.createElement(c.type==='select'?'select':'input');if(c.type==='range'){el.type='range';el.min=c.min;el.max=c.max;el.step=c.step||1;}el.setAttribute('aria-label',c.label);box.appendChild(el);el.addEventListener(c.type==='range'?'input':'change',()=>act(c.key,el.value));}
    $('controls').appendChild(box);bindings.set(c.key,{el,box,valueLabel,nameLabel,type:c.type,options:''});
  }
  function syncControls(){
    const controls=module().controls();const keys=new Set(controls.map(c=>c.key));
    for(const [key,b] of bindings){if(!keys.has(key)){b.box.remove();bindings.delete(key);}}
    controls.forEach(c=>{if(!bindings.has(c.key))makeControl(c);const b=bindings.get(c.key);if(c.type==='button'){b.el.textContent=c.label;if(c.pressed!==undefined)b.el.setAttribute('aria-pressed',String(c.pressed));else b.el.removeAttribute('aria-pressed');}else{b.nameLabel.textContent=c.label;b.el.setAttribute('aria-label',c.label);if(c.type==='select'){const signature=JSON.stringify(c.options);if(signature!==b.options){b.el.replaceChildren();c.options.forEach(option=>{const el=document.createElement('option');el.value=option.value;el.textContent=option.label;b.el.appendChild(el);});b.options=signature;}}b.el.value=String(c.value);b.valueLabel.textContent=c.type==='range'?String(c.value):'';}b.el.disabled=Boolean(c.disabled);});
  }
  function report(){const message=module().status();if(message&&$('status').textContent!==message)$('status').textContent=message;}
  function act(key,value){const result=module().action(key,value);if(paused&&true){module().update(.033,time);}if(result&&result.download)download(result.download);syncControls();report();draw();schedule();}
  function download(data){try{const blob=new Blob([data.content],{type:data.type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=data.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('status').textContent='Download is unavailable in this viewer.';}}
  function draw(){if(!W||!H)return;ctx.clearRect(0,0,W,H);ctx.fillStyle='#080808';ctx.fillRect(0,0,W,H);ctx.save();module().draw(ctx,W,H,time);ctx.restore();}
  function run(now){raf=0;if(last!==null&&now-last<1000/30){schedule();return;}const dt=last===null?0:Math.min((now-last)/1000,.06);last=now;time+=dt;module().update(dt,time);draw();report();if(time-syncTime>.2){syncControls();syncTime=time;}schedule();}
  function schedule(){if(!paused&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(run);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;module().suspend?.();if(bindings.size)syncControls();}
  function initializeScene(){captured=false;$('title').textContent=title;$('hint').textContent=hint;canvas.setAttribute('aria-label',title+'. '+hint+' Controls are below.');syncControls();report();draw();schedule();}
  function pauseLabel(){$('pause').textContent=paused?'PLAY':'PAUSE';$('pause').setAttribute('aria-label',paused?'Play animation':'Pause animation');}
  $('pause').addEventListener('click',()=>{paused=!paused;pauseLabel();if(paused)stop();else schedule();syncControls();$('status').textContent=paused?'Animation paused.':'Animation playing.';});
  function pos(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/W)),Math.max(0,Math.min(1,(e.clientY-r.top)/H))];}
  function pointer(kind,e){const p=pos(e);module().pointer?.(kind,...p);if(paused&&kind==='move'&&true)module().update(.033,time);if(kind!=='move'||captured)syncControls();if(kind==='up'||kind==='down')report();draw();}
  canvas.addEventListener('pointerdown',e=>{captured=true;canvas.setPointerCapture(e.pointerId);pointer('down',e);});
  canvas.addEventListener('pointermove',e=>pointer('move',e));
  canvas.addEventListener('pointerup',e=>{captured=false;pointer('up',e);});
  canvas.addEventListener('pointercancel',e=>{captured=false;pointer('up',e);});
  canvas.addEventListener('pointerleave',e=>{if(!captured)pointer('leave',e);});
  canvas.addEventListener('wheel',e=>{if(module().wheel){e.preventDefault();module().wheel(e.deltaY);if(paused)module().update(.033,time);syncControls();report();draw();}},{passive:false});
  function resize(){const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  function visibility(){if(document.hidden||!visible)stop();else schedule();}
  document.addEventListener('visibilitychange',visibility);
  if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visibility();}).observe(root);
  if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  media.addEventListener('change',()=>{if(media.matches){paused=true;stop();pauseLabel();syncControls();$('status').textContent='Reduced motion: still preview. Press Play to animate.';}});
  resize();initializeScene();pauseLabel();if(paused)$('status').textContent='Reduced motion: still preview. Press Play to animate.';
  if(document.fonts)document.fonts.ready.then(draw);
  window.XLR8Preview.connect(settings => { Object.assign(appearance, settings); canvas.style.height = appearance.compact ? '320px' : ''; resize(); });
})();
