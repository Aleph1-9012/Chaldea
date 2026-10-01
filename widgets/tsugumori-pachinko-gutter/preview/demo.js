// SPDX-License-Identifier: 0BSD
(() => {

function makePachinko() {
  const pins=[],balls=[],bins=[0,0,0,0,0],gates=[{x:.31,y:.72,a:.38},{x:.69,y:1.04,a:-.38}];
  for(let row=0;row<6;row++)for(let col=0;col<(row%2?4:5);col++){
    const pin={x:.14+col*.18+(row%2?.09:0),y:.35+row*.155,flash:0};
    if(gates.every(gate=>Math.hypot(pin.x-gate.x,pin.y-gate.y)>.205))pins.push(pin);
  }
  let launch=.5,selected=0,message='Ready to launch',serial=0,drag=null,accumulator=0,dims={w:688,h:410};
  const radius=.023,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function geometry(){const s=Math.min(dims.w*.78,dims.h*.51);return {s,x:(dims.w-s)/2,y:(dims.h-s*1.6)/2};}
  function world(x,y){const g=geometry();return {x:(x*dims.w-g.x)/g.s,y:(y*dims.h-g.y)/g.s};}
  function ends(g){const dx=Math.cos(g.a)*.125,dy=Math.sin(g.a)*.125;return {ax:g.x-dx,ay:g.y-dy,bx:g.x+dx,by:g.y+dy};}
  function closest(p,g){const e=ends(g),vx=e.bx-e.ax,vy=e.by-e.ay,u=clamp(((p.x-e.ax)*vx+(p.y-e.ay)*vy)/(vx*vx+vy*vy),0,1);return {x:e.ax+u*vx,y:e.ay+u*vy};}
  function fire(vx=0,vy=0){
    if(balls.length>=6){message='Six balls in play';return;}
    balls.push({id:++serial,x:launch,y:.13,vx:clamp(vx,-1.4,1.4),vy:clamp(vy,-.45,1.2),age:0,trail:[]});message='Ball '+String(serial).padStart(2,'0')+' in play';
  }
  function collide(ball,x,y,r,bounce){
    let dx=ball.x-x,dy=ball.y-y,d=Math.hypot(dx,dy),min=radius+r;
    if(d>=min)return false;
    if(d<.000001){dx=.0001*(ball.id%2?1:-1);dy=-.001;d=Math.hypot(dx,dy);}
    const nx=dx/d,ny=dy/d;ball.x=x+nx*(min+.0001);ball.y=y+ny*(min+.0001);
    const normal=ball.vx*nx+ball.vy*ny;
    if(normal<0){ball.vx-=(1+bounce)*normal*nx;ball.vy-=(1+bounce)*normal*ny;}
    if(Math.abs(nx)<.008&&ny<-.8&&Math.abs(ball.vx)<.025)ball.vx+=(ball.id%2?1:-1)*.025;
    return true;
  }
  function tick(dt){
    for(const p of pins)p.flash=Math.max(0,p.flash-dt*4);
    for(let i=balls.length-1;i>=0;i--){
      const b=balls[i];b.age+=dt;b.vy=Math.min(2.5,b.vy+2.15*dt);b.vx*=Math.exp(-.05*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<radius){b.x=radius;b.vx=Math.abs(b.vx)*.64;}if(b.x>1-radius){b.x=1-radius;b.vx=-Math.abs(b.vx)*.64;}
      if(b.y<radius){b.y=radius;b.vy=Math.abs(b.vy)*.5;}
      for(const p of pins)if(collide(b,p.x,p.y,.014,.63))p.flash=1;
      for(const gate of gates){const point=closest(b,gate);collide(b,point.x,point.y,.012,.56);}
      if(b.y>1.38)for(let wall=1;wall<5;wall++){const x=wall*.2;if(Math.abs(b.x-x)<radius+.006){if(b.x<x){b.x=x-radius-.006;b.vx=-Math.abs(b.vx)*.5;}else{b.x=x+radius+.006;b.vx=Math.abs(b.vx)*.5;}}}
      if(b.y>1.51){const bin=clamp(Math.floor(b.x*5),0,4);bins[bin]++;message='Ball '+String(b.id).padStart(2,'0')+' collected · pocket '+(bin+1);balls.splice(i,1);continue;}
      if(b.age>25){message='Ball '+String(b.id).padStart(2,'0')+' stalled · cleared';balls.splice(i,1);continue;}
      if(!b.trail.length||Math.hypot(b.x-b.trail[b.trail.length-1].x,b.y-b.trail[b.trail.length-1].y)>.018){b.trail.push({x:b.x,y:b.y});if(b.trail.length>12)b.trail.shift();}
    }
  }
  return {
    controls:()=>[
      {type:'button',key:'launch',label:'Launch ball',disabled:balls.length>=6},
      {type:'range',key:'position',label:'Launch position',value:Math.round(launch*100),min:8,max:92,step:1},
      {type:'select',key:'gate',label:'Gate',value:String(selected),options:[{value:'0',label:'Upper gate'},{value:'1',label:'Lower gate'}]},
      {type:'range',key:'angle',label:'Gate angle',value:Math.round(gates[selected].a*180/Math.PI),min:-65,max:65,step:1}
    ],
    status:()=>message,
    action(key,value){
      if(key==='launch')fire();
      if(key==='position'){launch=clamp((Number(value)||50)/100,.08,.92);message='Launch position set';}
      if(key==='gate'){selected=Number(value)===1?1:0;message=(selected?'Lower':'Upper')+' gate selected';}
      if(key==='angle'){gates[selected].a=clamp(Number(value)||0,-65,65)*Math.PI/180;message=(selected?'Lower':'Upper')+' gate rotated';}
    },
    pointer(kind,x,y){
      const p=world(x,y);
      if(kind==='down'){
        let nearest=-1,d=Infinity;
        for(let i=0;i<gates.length;i++){const q=closest(p,gates[i]),distance=Math.hypot(p.x-q.x,p.y-q.y);if(distance<d){d=distance;nearest=i;}}
        if(d*geometry().s<24){selected=nearest;drag={kind:'gate',index:nearest};message=(selected?'Lower':'Upper')+' gate selected';}
        else if(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1.6){launch=clamp(p.x,.08,.92);drag={kind:'launch',x:p.x,y:p.y};}
      }
      if(kind==='move'&&drag&&drag.kind==='gate'){
        const gate=gates[drag.index];let angle=Math.atan2(p.y-gate.y,p.x-gate.x);if(angle>Math.PI/2)angle-=Math.PI;if(angle<-Math.PI/2)angle+=Math.PI;
        gate.a=clamp(angle,-65*Math.PI/180,65*Math.PI/180);message=(selected?'Lower':'Upper')+' gate rotated';
      }
      if(kind==='up'&&drag){if(drag.kind==='launch')fire((p.x-drag.x)*3.5,(p.y-drag.y)*3);drag=null;}
      if(kind==='leave')drag=null;
    },
    suspend(){drag=null;accumulator=0;},
    update(dt){accumulator+=clamp(Number(dt)||0,0,.2);while(accumulator>=1/240){tick(1/240);accumulator-=1/240;}},
    draw(ctx,w,h){
      dims={w,h};const g=geometry(),s=g.s;ctx.save();ctx.fillStyle='#080808';ctx.fillRect(0,0,w,h);ctx.translate(g.x,g.y);ctx.scale(s,s);
      ctx.strokeStyle='#5e5c55';ctx.lineWidth=1/s;ctx.beginPath();ctx.moveTo(0,.06);ctx.lineTo(0,1.57);ctx.lineTo(1,1.57);ctx.lineTo(1,.06);ctx.stroke();
      ctx.strokeStyle='#33342f';ctx.beginPath();ctx.moveTo(.05,.23);ctx.lineTo(.95,.23);ctx.stroke();
      ctx.strokeStyle='#cc1515';ctx.lineWidth=2/s;ctx.beginPath();ctx.moveTo(launch-.038,.05);ctx.lineTo(launch,.09);ctx.lineTo(launch+.038,.05);ctx.stroke();
      ctx.setLineDash([2/s,5/s]);ctx.strokeStyle='#535049';ctx.lineWidth=1/s;ctx.beginPath();ctx.moveTo(launch,.105);ctx.lineTo(launch,.20);ctx.stroke();ctx.setLineDash([]);
      for(const p of pins){
        if(p.flash>0){ctx.strokeStyle='rgba(232,228,216,'+p.flash*.6+')';ctx.beginPath();ctx.arc(p.x,p.y,.035+(1-p.flash)*.018,0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle='#e8e4d8';ctx.beginPath();ctx.arc(p.x,p.y,.014,0,Math.PI*2);ctx.fill();ctx.fillStyle='#747269';ctx.beginPath();ctx.arc(p.x+.003,p.y+.003,.005,0,Math.PI*2);ctx.fill();
      }
      for(let i=0;i<gates.length;i++){
        const gate=gates[i],e=ends(gate);ctx.strokeStyle=i===selected?'#e8e4d8':'#77756b';ctx.lineWidth=4/s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.ax,e.ay);ctx.lineTo(e.bx,e.by);ctx.stroke();
        ctx.fillStyle='#cc1515';ctx.beginPath();ctx.arc(gate.x,gate.y,.028,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#080808';ctx.lineWidth=1/s;ctx.beginPath();ctx.moveTo(gate.x-.013,gate.y);ctx.lineTo(gate.x+.013,gate.y);ctx.stroke();
        if(i===selected){ctx.strokeStyle='#666259';ctx.lineWidth=1/s;ctx.beginPath();ctx.arc(gate.x,gate.y,.062,-1.13,1.13);ctx.stroke();}
      }
      for(let i=0;i<5;i++){
        ctx.fillStyle=i===2?'#351010':'#171815';ctx.fillRect(i*.2+.014,1.39,.172,.155);
        ctx.strokeStyle='#77746b';ctx.lineWidth=1/s;ctx.beginPath();ctx.moveTo(i*.2,1.38);ctx.lineTo(i*.2,1.56);ctx.stroke();
        ctx.fillStyle=i===2?'#f06a53':'#b7b1a4';ctx.font=(11/s)+'px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText(String(bins[i]).padStart(2,'0'),i*.2+.1,1.49);
      }
      for(const b of balls){
        ctx.strokeStyle='rgba(204,21,21,.30)';ctx.lineWidth=2/s;ctx.beginPath();b.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
        ctx.fillStyle='#cc1515';ctx.beginPath();ctx.arc(b.x,b.y,radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f38b71';ctx.beginPath();ctx.arc(b.x-.006,b.y-.007,.005,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();ctx.save();ctx.fillStyle='#8d8c84';ctx.font='11px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText('GRAVITY / 05 POCKETS',w/2,h-14);ctx.restore();
    }
  };
}
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makePachinko();
  const title="PACHINKO GUTTER";
  const hint="Flick or launch the ball. Reposition the gates to change its route.";
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
