// SPDX-License-Identifier: 0BSD
(() => {

function makeKirigami() {
  const C={black:'#080808',ivory:'#e8e4d8',red:'#cc1515'};
  let fold=.61, yaw=-.43, tilt=.96, pattern='fins', drag=null, cut=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const options=[{value:'fins',label:'Radial fins'},{value:'bridges',label:'Stepped bridges'},{value:'chevrons',label:'Chevron lattice'}];
  function projection(p) {
    const a=p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),b=p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw);
    const y=b*Math.cos(tilt)-p[2]*Math.sin(tilt),z=b*Math.sin(tilt)+p[2]*Math.cos(tilt),persp=7/(7-z);
    return [a*persp,y*persp,z];
  }
  function at(x,y,z=0){return [x,y,z];}
  function geometry() {
    const panels=[],holes=[],creases=[],marks=[];
    const addPanel=(p,frontWinding,code)=>panels.push({p,frontWinding,code});
    const angle=fold*Math.PI*.45;
    if(pattern==='fins') {
      const count=cut===1?7:cut===2?11:9;
      for(let i=0;i<count;i++) {
        const a=(i-(count-1)/2)*.155, x=(i-(count-1)/2)*.31;
        const height=.85+(.6-Math.abs(i-(count-1)/2)*.12), width=.19;
        const rotate=(xx,yy,z=0)=>[x+xx*Math.cos(a)-yy*Math.sin(a),yy*Math.cos(a)+xx*Math.sin(a),z];
        const y0=-.78, y1=y0+height;
        holes.push([rotate(-width/2,y0),rotate(width/2,y0),rotate(width/2,y1),rotate(-width/2,y1)]);
        const aa=angle*(.79+.21*Math.cos(i*.6));
        const reverse=i%2===0, hinge=reverse?y0:y1, liftY=hinge+(reverse?1:-1)*height*Math.cos(aa);
        const base=[rotate(-width/2,hinge),rotate(width/2,hinge)],free=[rotate(width/2,liftY,height*Math.sin(aa)),rotate(-width/2,liftY,height*Math.sin(aa))];
        addPanel([...base,...free],reverse?1:-1,`F${String(i+1).padStart(2,'0')}`);
        creases.push(base);
        marks.push({a:rotate(-width/2-.045,y0),b:rotate(width/2+.045,y0)});
      }
    } else if(pattern==='bridges') {
      const count=cut===1?4:cut===2?7:5;
      for(let i=0;i<count;i++) {
        const x=(i-(count-1)/2)*.40,width=.26,length=1.55-Math.abs(i-(count-1)/2)*.18;
        const rise=Math.sin(angle)*(.54+(count/2-Math.abs(i-(count-1)/2))*.10),run=length*.27;
        const y0=-length/2,y1=length/2;
        holes.push([at(x-width/2,y0),at(x+width/2,y0),at(x+width/2,y1),at(x-width/2,y1)]);
        const b0=at(x-width/2,y0),b1=at(x+width/2,y0),b2=at(x+width/2,y1),b3=at(x-width/2,y1);
        const k0=at(x-width/2,y0+run,rise),k1=at(x+width/2,y0+run,rise),k2=at(x+width/2,y1-run,rise),k3=at(x-width/2,y1-run,rise);
        addPanel([b0,b1,k1,k0],1,`B${i+1}A`);addPanel([k0,k1,k2,k3],1,`B${i+1}B`);addPanel([k3,k2,b2,b3],1,`B${i+1}C`);
        creases.push([k0,k1],[k2,k3],[b0,b1],[b2,b3]);
      }
    } else {
      const rows=cut===1?3:cut===2?5:4;
      for(let row=0;row<rows;row++) for(let col=0;col<4;col++) {
        const x=(col-1.5)*.58, y=(row-(rows-1)/2)*.39;
        const width=.44,depth=.25;
        const p0=at(x-width/2,y),p1=at(x,y+depth),p2=at(x+width/2,y);
        holes.push([p0,p1,p2]);
        const tip=at(x,y+depth*Math.cos(angle),depth*Math.sin(angle)*(1.1+row*.24));
        addPanel([p0,tip,p2],-1,`C${row+1}${col+1}`);creases.push([p0,p2]);
      }
    }
    return {panels,holes,creases,marks};
  }
  return {
    controls:()=>[
      {type:'range',key:'fold',label:'Fold angle',min:0,max:85,step:1,value:Math.round(fold*81)},
      {type:'range',key:'orbit',label:'View angle',min:-180,max:180,step:1,value:Math.round(((yaw*180/Math.PI+180)%360+360)%360-180)},
      {type:'range',key:'tilt',label:'View tilt',min:29,max:68,step:1,value:Math.round(tilt*180/Math.PI)},
      {type:'select',key:'pattern',label:'Cut pattern',value:pattern,options},
      {type:'button',key:'edit',label:['Fewer cuts','Add cuts','Restore cuts'][cut]}
    ],
    update(){},
    draw(ctx,w,h) {
      ctx.save();ctx.fillStyle=C.black;ctx.fillRect(0,0,w,h);
      const {panels,holes,creases,marks}=geometry();
      const sheet=[at(-1.85,-1.30),at(1.85,-1.30),at(1.85,1.30),at(-1.85,1.30)];
      const all=[...sheet,...panels.flatMap(p=>p.p)].map(projection);
      const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
      const scale=Math.min((w-42)/(maxX-minX),(h-102)/(maxY-minY));
      const cx=w/2-(minX+maxX)*scale/2,cy=h/2+4-(minY+maxY)*scale/2;
      const toScreen=p=>{const q=projection(p);return [cx+q[0]*scale,cy+q[1]*scale];};
      function path(points,close=true){ctx.beginPath();points.map(toScreen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(close)ctx.closePath();}
      path(sheet);ctx.fillStyle='#151713';ctx.fill();ctx.strokeStyle='#585c50';ctx.lineWidth=1;ctx.stroke();
      // Printed reference grid lives on the dark sheet, below every fold.
      ctx.save();path(sheet);ctx.clip();ctx.strokeStyle='#2b3026';ctx.lineWidth=.55;
      for(let x=-1.8;x<=1.8;x+=.2){path([at(x,-1.30,.001),at(x,1.30,.001)],false);ctx.stroke();}
      for(let y=-1.2;y<=1.2;y+=.2){path([at(-1.85,y,.001),at(1.85,y,.001)],false);ctx.stroke();}
      ctx.restore();
      // Cut holes stay truly black, with a fine red paper edge along the slit.
      for(const hole of holes){path(hole);ctx.fillStyle='#030403';ctx.fill();ctx.strokeStyle='#703027';ctx.lineWidth=.7;ctx.stroke();}
      // A local shadow below each lifted panel makes the depth clear.
      for(const panel of panels){path(panel.p.map(p=>[p[0]+p[2]*.20,p[1]+p[2]*.14,.002]));ctx.fillStyle='rgba(0,0,0,.48)';ctx.fill();}
      ctx.strokeStyle='#898f7d';ctx.lineWidth=.7;ctx.setLineDash([2,3]);for(const crease of creases){path(crease,false);ctx.stroke();}ctx.setLineDash([]);
      ctx.strokeStyle='#a4a994';ctx.lineWidth=.65;for(const mark of marks){path([mark.a,mark.b],false);ctx.stroke();}
      const ordered=panels.map(p=>({...p,z:p.p.reduce((s,q)=>s+projection(q)[2],0)/p.p.length})).sort((a,b)=>a.z-b.z);
      for(const panel of ordered) {
        const projected=panel.p.map(toScreen);
        const area=projected.reduce((n,p,i)=>{const q=projected[(i+1)%projected.length];return n+p[0]*q[1]-p[1]*q[0];},0);
        const front=area*panel.frontWinding>0;
        // The red reverse is a second opaque face offset by paper thickness.
        const back=panel.p.map(p=>[p[0],p[1],p[2]-.017]);
        path(back);ctx.fillStyle=C.red;ctx.fill();ctx.strokeStyle='#ec5542';ctx.lineWidth=.7;ctx.stroke();
        path(panel.p);ctx.fillStyle=front?C.ivory:'#b62318';ctx.fill();ctx.strokeStyle=front?'#a9aa9b':'#ed5746';ctx.lineWidth=.65;ctx.stroke();
        // Fine parallel score lines follow the folded face, not the screen.
        if(panel.p.length===4) {
          const [a,b,c,d]=panel.p;
          for(const q of [.08,.92]) {
            const u=a.map((n,i)=>n+(b[i]-n)*q),v=d.map((n,i)=>n+(c[i]-n)*q);
            path([u,v],false);ctx.strokeStyle=front?'#9b9f8f':'#712219';ctx.lineWidth=.45;ctx.stroke();
          }
        }
      }
      // Corner registration crosses and small measuring ticks.
      ctx.strokeStyle='#a1a58f';ctx.lineWidth=.8;
      for(const [x,y] of [[-1.64,-1.09],[1.64,-1.09],[-1.64,1.09],[1.64,1.09]]){path([at(x-.065,y,.005),at(x+.065,y,.005)],false);ctx.stroke();path([at(x,y-.065,.005),at(x,y+.065,.005)],false);ctx.stroke();}
      for(let x=-1.5;x<=1.5;x+=.1){path([at(x,1.20,.005),at(x,1.20-(Math.round(x*10)%5===0?.07:.035),.005)],false);ctx.stroke();}
      ctx.fillStyle='#979d8b';ctx.font='11px "JetBrains Mono", monospace';ctx.fillText('CUT / FOLD / LIFT',16,20);
      ctx.textAlign='right';ctx.fillStyle=C.red;ctx.fillText(`${Math.round(fold*81)}°`,w-16,20);ctx.textAlign='left';
      ctx.fillStyle='#979d8b';ctx.fillText('DRAG TO FOLD + TILT',16,h-14);
      if(w>420){ctx.textAlign='right';ctx.fillText(`${holes.length} CUTS`,w-16,h-14);ctx.textAlign='left';}
      ctx.restore();
    },
    pointer(kind,x,y) {
      if(kind==='down')drag={x,y,fold,yaw,tilt};
      if(kind==='move'&&drag){fold=clamp(drag.fold-(y-drag.y)*1.35,0,85/81);yaw=drag.yaw+(x-drag.x)*2.2;tilt=clamp(drag.tilt+(y-drag.y)*.40,.50,1.19);}
      if(kind==='up'||kind==='leave')drag=null;
    },
    action(key,value){if(key==='fold')fold=clamp(Number(value)/81,0,85/81);if(key==='orbit')yaw=clamp(Number(value),-180,180)*Math.PI/180;if(key==='tilt')tilt=clamp(Number(value),29,68)*Math.PI/180;if(key==='pattern'&&options.some(p=>p.value===value))pattern=value;if(key==='edit')cut=(cut+1)%3;},
    suspend(){drag=null;},
    status:()=>`${options.find(p=>p.value===pattern).label} · ${Math.round(fold*81)}° fold · ${geometry().holes.length} cuts`
  };
}
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makeKirigami();
  const title="KIRIGAMI PANEL";
  const hint="Pull the sheet open. Change the cut pattern to reveal another structure.";
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
