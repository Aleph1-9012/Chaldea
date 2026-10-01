// SPDX-License-Identifier: 0BSD
(() => {

function makeKineticType() {
  const ink='#e8e4d8',accent='#cc1515';
  let width=688,height=410,tension=4,drag=null,event='Drag a strand to stretch it';
  let selected=null,pluckCount=0;
  const strands=[];
  function resample(vertices,steps) {
    const distances=[0];
    for(let i=1;i<vertices.length;i++) distances.push(distances[i-1]+Math.hypot(vertices[i][0]-vertices[i-1][0],vertices[i][1]-vertices[i-1][1]));
    const total=distances[distances.length-1],result=[];
    let segment=1;
    for(let i=0;i<=steps;i++) {
      const d=total*i/steps;
      while(segment<distances.length-1 && distances[segment]<d) segment++;
      const ratio=(d-distances[segment-1])/(distances[segment]-distances[segment-1]);
      const a=vertices[segment-1],b=vertices[segment];
      result.push([a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio]);
    }
    return result;
  }
  function add(points,glyph,lane,closed=false) {
    strands.push({glyph,lane,closed,points:points.map(([x,y])=>({x,y,dx:0,dy:0,vx:0,vy:0,fx:0,fy:0}))});
  }
  const laneCount=19;
  for(let lane=0;lane<laneCount;lane++) {
    const off=(lane/(laneCount-1)-.5)*.155;
    add(resample([[.055,.13+off],[.64+off*.6,.13+off],[.205+off*.72,.94]],64),0,lane);
    const oval=[];
    for(let i=0;i<120;i++) {
      const theta=-Math.PI/2+i/120*Math.PI*2,c=Math.cos(theta),s=Math.sin(theta);
      oval.push([1.225+(.30+off)*Math.sign(c)*Math.pow(Math.abs(c),.57),.515+(.407+off)*Math.sign(s)*Math.pow(Math.abs(s),.57)]);
    }
    add(oval,1,lane,true);
    add(resample([[2.245+off*.6,.07],[1.805+off*.6,.70+off],[2.48,.70+off]],60),2,lane);
    add(resample([[2.305+off,.065],[2.305+off,.94]],44),2,lane);
  }
  function geometry() {
    const sx=(width-Math.max(36,width*.12))/2.56;
    return {sx,sy:Math.min(height*.66,sx*1.78),cx:width*.5,cy:height*.48};
  }
  function screen(p,g) {return {x:g.cx+(p.x+p.dx-1.28)*g.sx,y:g.cy+(p.y+p.dy-.5)*g.sy};}
  function nearest(px,py,g) {
    let best=null,dist=Infinity;
    for(let s=0;s<strands.length;s++) for(let i=0;i<strands[s].points.length;i++) {
      const p=strands[s].points[i],q=screen(p,g),d=(q.x-px)**2+(q.y-py)**2;
      if(d<dist) {dist=d;best={s,i,p,q};}
    }
    return best;
  }
  function release() { if(drag) event='Released; strands spring back';drag=null; }
  function pluck() {
    const g=geometry();
    const positions=[[1.52,.52],[.44,.52],[2.27,.66]];
    const center=positions[pluckCount++%positions.length];
    for(const s of strands) for(const p of s.points) {
      const d=Math.hypot((p.x-center[0])*g.sx,(p.y-center[1])*g.sy);
      const weight=Math.exp(-(d*d)/(2*(Math.min(width,height)*.155)**2));
      p.dx+=weight*(pluckCount%2?.16:-.16);
      p.dy-=weight*.10;
      p.vx+=weight*(pluckCount%2?3.5:-3.5);
      p.vy-=weight*2.7;
    }
    event='Strands plucked';
  }
  return {
    controls() {return [
      {type:'button',key:'pluck',label:'Pluck strands'},
      {type:'range',key:'tension',label:'Tension',min:1,max:8,step:.5,value:tension}
    ];},
    draw(ctx,w,h) {
      width=w;height=h;
      const g=geometry();
      ctx.save();
      ctx.lineCap='round';ctx.lineJoin='round';
      for(let s=0;s<strands.length;s++) {
        const strand=strands[s];
        const active=selected && Math.abs(selected.s-s)<=2 && strand.glyph===strands[selected.s].glyph;
        ctx.strokeStyle=active||strand.lane===0?accent:ink;
        ctx.globalAlpha=active?.98:strand.lane===0?.8:.72;
        ctx.lineWidth=active?1.3:Math.max(.72,Math.min(1.15,g.sx*.0037));
        ctx.beginPath();
        for(let i=0;i<strand.points.length;i++) {
          const q=screen(strand.points[i],g);
          if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
        }
        if(strand.closed)ctx.closePath();
        ctx.stroke();
      }
      if(drag) {
        ctx.globalAlpha=.7;ctx.strokeStyle=accent;ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(drag.px,drag.py,7,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    },
    update(dt) {
      const elapsed=Math.max(0,Math.min(.05,dt));
      const steps=Math.max(1,Math.ceil(elapsed/.008));
      const step=elapsed/steps,k=68+tension*25,damping=6+tension*.9,coupling=90;
      for(let pass=0;pass<steps;pass++) {
        for(const s of strands) {
          const ps=s.points,n=ps.length;
          for(let i=0;i<n;i++) {
            const p=ps[i],a=ps[(i-1+n)%n],b=ps[(i+1)%n];
            const adjacent=s.closed||(i>0&&i<n-1);
            p.fx=-k*p.dx-damping*p.vx+(adjacent?coupling*(a.dx+b.dx-2*p.dx):0);
            p.fy=-k*p.dy-damping*p.vy+(adjacent?coupling*(a.dy+b.dy-2*p.dy):0);
          }
          for(let i=0;i<n;i++) {
            const p=ps[i];
            p.vx+=p.fx*step;p.vy+=p.fy*step;
            p.dx+=p.vx*step;p.dy+=p.vy*step;
            if(Math.abs(p.dx)+Math.abs(p.dy)+Math.abs(p.vx)+Math.abs(p.vy)<.000015) p.dx=p.dy=p.vx=p.vy=0;
          }
        }
        if(drag) {
          const g=geometry(),dx=(drag.px-drag.startX)/g.sx,dy=(drag.py-drag.startY)/g.sy;
          for(const a of drag.anchors) {
            const blend=Math.min(1,step*55*a.weight);
            a.p.dx+=(a.dx+dx*a.weight-a.p.dx)*blend;
            a.p.dy+=(a.dy+dy*a.weight-a.p.dy)*blend;
            a.p.vx*=Math.exp(-step*25*a.weight);a.p.vy*=Math.exp(-step*25*a.weight);
          }
        }
      }
    },
    pointer(kind,x,y) {
      const px=x*width,py=y*height,g=geometry();
      if(kind==='down') {
        selected=nearest(px,py,g);
        const anchors=[],radius=Math.max(28,Math.min(width,height)*.14);
        for(const s of strands) for(const p of s.points) {
          const q=screen(p,g),d=Math.hypot(q.x-selected.q.x,q.y-selected.q.y);
          if(d<radius*2) anchors.push({p,dx:p.dx,dy:p.dy,weight:Math.exp(-d*d/(radius*radius*.6))});
        }
        drag={px,py,startX:px,startY:py,anchors};event='Stretching strands';
      } else if(kind==='move') {
        if(drag) {
          drag.px=px;drag.py=py;
          // Input stays visible when the host pauses animation or reduces motion.
          const dx=(px-drag.startX)/g.sx,dy=(py-drag.startY)/g.sy;
          for(const a of drag.anchors) {
            a.p.dx=a.dx+dx*a.weight;a.p.dy=a.dy+dy*a.weight;
            a.p.vx*=1-a.weight;a.p.vy*=1-a.weight;
          }
        }
        else selected=nearest(px,py,g);
      } else if(kind==='up') release();
      else if(kind==='leave') {release();selected=null;}
    },
    action(key,value) {
      if(key==='pluck') pluck();
      if(key==='tension') {tension=Math.max(1,Math.min(8,Number(value)||4));event='Strand tension changed';}
    },
    suspend() {release();selected=null;},
    status() {return event;}
  };
}
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makeKineticType();
  const title="KINETIC TYPOGRAPHY";
  const hint="Pull a strand and release it, or use Pluck.";
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
