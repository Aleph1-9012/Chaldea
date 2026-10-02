// SPDX-License-Identifier: 0BSD
(() => {
  function makeMagnetic() {
    const magnets=[{x:.32,y:.45,p:1},{x:.69,y:.58,p:-1},{x:.52,y:.25,p:1}];
    let count=2,selected=0,drag=false,filings=[],seed=2,w=0,h=0,shake=0,message='Drag either magnet beneath the filings.';
    const rand=n=>{const k=Math.sin(n*127.1+seed*24.9)*43758.54;return k-Math.floor(k);};
    function populate(){filings=[];const nx=w<400?31:55,ny=29;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*nx+x;filings.push({x:.045+(x+.2+rand(i)*.6)/nx*.91,y:.075+(y+.2+rand(i+1900)*.6)/ny*.85,angle:rand(i+80)*Math.PI,noise:rand(i+700)*2-1});}}
    function field(x,y){let fx=0,fy=0;for(let i=0;i<count;i++){const m=magnets[i],dx=x-m.x,dy=(y-m.y)*h/w,d2=dx*dx+dy*dy+.004,force=m.p/Math.pow(d2,1.25);fx+=dx*force;fy+=dy*force;}return [fx,fy];}
    const api={
      controls:()=>[{type:'select',key:'magnet',label:'MAGNET',value:String(selected),options:Array.from({length:count},(_,i)=>({value:String(i),label:'0'+(i+1)}))},{type:'range',key:'x',label:'X POSITION',value:Math.round(magnets[selected].x*100),min:12,max:88,step:1},{type:'range',key:'y',label:'Y POSITION',value:Math.round(magnets[selected].y*100),min:15,max:85,step:1},{type:'button',key:'polarity',label:magnets[selected].p>0?'POLE: N':'POLE: S'},{type:'button',key:'third',label:count===2?'ADD MAGNET':'REMOVE 03',pressed:count===3},{type:'button',key:'shake',label:'SHAKE'}],
      action(key,value){if(key==='magnet')selected=Number(value);if(key==='x')magnets[selected].x=Number(value)/100;if(key==='y')magnets[selected].y=Number(value)/100;if(key==='polarity')magnets[selected].p*=-1;if(key==='third'){count=count===2?3:2;selected=Math.min(selected,count-1);}if(key==='shake'){seed++;populate();shake=1;}message=key==='shake'?'Filings scattered. The field gathers them again.':'Magnet 0'+(selected+1)+' / '+(magnets[selected].p>0?'north':'south')+' pole.';},
      update(dt){shake=Math.max(0,shake-dt*.6);filings.forEach(p=>{const f=field(p.x,p.y),angle=Math.atan2(f[1],f[0])+p.noise*shake*2,d=Math.atan2(Math.sin((angle-p.angle)*2),Math.cos((angle-p.angle)*2))/2;p.angle+=d*Math.min(1,dt*7);});},
      draw(ctx,W,H){if(W!==w||H!==h){w=W;h=H;populate();api.update(1);}ctx.save();ctx.strokeStyle='#33312d';ctx.lineWidth=.8;ctx.strokeRect(w*.025,h*.05,w*.95,h*.9);ctx.lineCap='round';
        for(const p of filings){let near=Infinity;for(let i=0;i<count;i++)near=Math.min(near,Math.hypot((p.x-magnets[i].x)*w,(p.y-magnets[i].y)*h));if(near<23)continue;const length=(w<400?3.8:5.6)*(1+Math.exp(-near/70)*.7),nx=Math.cos(p.angle)*length,ny=Math.sin(p.angle)*length,x=p.x*w,y=p.y*h;ctx.strokeStyle='rgba(232,228,216,'+(.37+.35*Math.exp(-near/140))+')';ctx.beginPath();ctx.moveTo(x-nx,y-ny);ctx.lineTo(x+nx,y+ny);ctx.stroke();}
        magnets.slice(0,count).forEach((m,i)=>{const x=m.x*w,y=m.y*h;ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fillStyle=m.p>0?'#cc1515':'#151515';ctx.fill();ctx.strokeStyle=i===selected?'#e8e4d8':'#cc1515';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#e8e4d8';ctx.font='12px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(m.p>0?'N':'S',x,y);});ctx.restore();},
      pointer(kind,x,y){if(kind==='down'){let near=45;for(let i=0;i<count;i++){const d=Math.hypot((x-magnets[i].x)*w,(y-magnets[i].y)*h);if(d<near){selected=i;near=d;drag=true;}}}if(kind==='move'&&drag){magnets[selected].x=Math.max(.12,Math.min(.88,x));magnets[selected].y=Math.max(.15,Math.min(.85,y));}if(kind==='up'||kind==='leave'){if(drag)message='Magnet 0'+(selected+1)+' repositioned.';drag=false;}},
      status:()=>message
    };return api;
  }
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makeMagnetic();
  const title="MAGNETIC POWDER";
  const hint="Drag a pole across the plate. Flip polarity or add a third magnet.";
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
