// SPDX-License-Identifier: 0BSD
(() => {
function makeRhythmWheel() {
  const TAU = Math.PI * 2, pins = Array.from({length:12}, (_,i) => [0,3,5,7,10].includes(i));
  let tempo=92, selected=0, position=-.015, sound=false, message='5 pins set · sound off';
  let audio=null, master=null, dims={w:688,h:410}, voices=new Set();
  const impacts=Array(12).fill(0);
  const describe=()=>{message=pins.filter(Boolean).length+' pins set · sound '+(sound?'on':'off');};
  function silence() {
    sound=false;
    if(master&&audio) master.gain.setValueAtTime(0,audio.currentTime);
    for(const voice of voices) {try{voice.stop();voice.disconnect();}catch(_) {}}
    voices.clear();
    if(audio&&audio.state==='running') audio.suspend().catch(()=>{});
    describe();
  }
  function strike(index) {
    impacts[index]=1;
    if(!sound||!audio||audio.state!=='running')return;
    const now=audio.currentTime, frequency=[220,247,277,330,370,415][index%6];
    for(const [ratio,level] of [[1,.10],[2.71,.026],[5.43,.009]]) {
      const oscillator=audio.createOscillator(), gain=audio.createGain();
      oscillator.type='sine'; oscillator.frequency.setValueAtTime(frequency*ratio,now);
      gain.gain.setValueAtTime(.00001,now);gain.gain.exponentialRampToValueAtTime(level,now+.004);
      gain.gain.exponentialRampToValueAtTime(.00001,now+.23);
      oscillator.connect(gain);gain.connect(master);voices.add(oscillator);
      oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(now);oscillator.stop(now+.25);
    }
  }
  function geometry(){const r=Math.min(dims.w*.30,dims.h*.30);return {x:dims.w*.5,y:dims.h*.48,r};}
  function toggle(index){selected=index;pins[index]=!pins[index];describe();}
  return {
    controls:()=>[
      {type:'range',key:'tempo',label:'Tempo · '+tempo+' BPM',value:tempo,min:40,max:180,step:1},
      {type:'select',key:'step',label:'Pin',value:String(selected),options:pins.map((on,i)=>({value:String(i),label:String(i+1).padStart(2,'0')+(on?' · set':' · empty')}))},
      {type:'button',key:'toggle',label:pins[selected]?'Remove pin':'Set pin',pressed:pins[selected]},
      {type:'button',key:'sound',label:sound?'Sound off':'Sound on',pressed:sound}
    ],
    status:()=>message,
    action(key,value){
      if(key==='tempo'){tempo=Math.max(40,Math.min(180,Number(value)||92));describe();}
      if(key==='step')selected=Math.max(0,Math.min(11,Math.round(Number(value)||0)));
      if(key==='toggle')toggle(selected);
      if(key==='sound'){
        if(sound){silence();return;}
        const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;
        if(!Constructor){message='Sound unavailable in this preview';return;}
        try{
          if(!audio){audio=new Constructor();master=audio.createGain();master.gain.value=.26;master.connect(audio.destination);}
          sound=true;master.gain.setValueAtTime(.26,audio.currentTime);describe();
          audio.resume().then(()=>{if(!sound&&audio.state==='running')audio.suspend().catch(()=>{});}).catch(()=>{silence();message='Sound could not start';});
        }catch(_){silence();message='Sound unavailable in this preview';}
      }
    },
    pointer(kind,x,y){
      if(kind!=='down')return;
      const g=geometry(),px=x*dims.w,py=y*dims.h;
      let nearest=-1,distance=Infinity;
      for(let i=0;i<12;i++){const a=i/12*TAU-Math.PI/2,d=Math.hypot(px-g.x-Math.cos(a)*g.r,py-g.y-Math.sin(a)*g.r);if(d<distance){nearest=i;distance=d;}}
      if(distance<Math.min(23,g.r*.23))toggle(nearest);
    },
    update(dt){
      dt=Math.max(0,Math.min(.5,Number(dt)||0));
      for(let i=0;i<12;i++)impacts[i]=Math.max(0,impacts[i]-dt*3.4);
      const next=position+dt*tempo/60*3;
      for(let i=Math.floor(position)+1;i<=Math.floor(next);i++){const pin=((i%12)+12)%12;if(pins[pin])strike(pin);}
      position=next%12;
    },
    suspend:silence,
    draw(ctx,w,h){
      dims={w,h};const {x,y,r}=geometry(),a=position/12*TAU-Math.PI/2;
      ctx.save();ctx.fillStyle='#080808';ctx.fillRect(0,0,w,h);ctx.translate(x,y);
      ctx.lineWidth=1;ctx.strokeStyle='#42413e';
      for(const radius of [r*.19,r*.41,r*.76,r*.90,r,r*1.12]){ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();}
      for(let i=0;i<72;i++){
        const ang=i/72*TAU,inner=r*(i%6===0?1.17:1.20),outer=r*1.23;
        ctx.beginPath();ctx.moveTo(Math.cos(ang)*inner,Math.sin(ang)*inner);ctx.lineTo(Math.cos(ang)*outer,Math.sin(ang)*outer);ctx.strokeStyle=i%6===0?'#87847c':'#393936';ctx.stroke();
      }
      ctx.strokeStyle='#222321';
      for(let i=0;i<6;i++){const ang=i/6*TAU+a*.18;ctx.beginPath();ctx.moveTo(Math.cos(ang)*r*.20,Math.sin(ang)*r*.20);ctx.lineTo(Math.cos(ang)*r*.74,Math.sin(ang)*r*.74);ctx.stroke();}
      for(let i=0;i<12;i++){
        const angle=i/12*TAU-Math.PI/2,px=Math.cos(angle)*r,py=Math.sin(angle)*r;
        if(impacts[i]>0){ctx.strokeStyle='rgba(232,228,216,'+impacts[i]*.65+')';ctx.beginPath();ctx.arc(px,py,9+(1-impacts[i])*19,0,TAU);ctx.stroke();}
        ctx.beginPath();ctx.arc(px,py,pins[i]?6:3.5,0,TAU);ctx.fillStyle=pins[i]?'#cc1515':'#080808';ctx.fill();ctx.strokeStyle=pins[i]?'#ed5b48':'#77766e';ctx.stroke();
        if(i===selected){ctx.strokeStyle='#e8e4d8';ctx.beginPath();ctx.arc(px,py,11,angle+.3,angle+TAU-.3);ctx.stroke();}
        ctx.fillStyle='#b4b0a5';ctx.font='11px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1).padStart(2,'0'),Math.cos(angle)*r*1.38,Math.sin(angle)*r*1.38);
      }
      ctx.rotate(a);ctx.strokeStyle='#e8e4d8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-r*.28,0);ctx.lineTo(r*.96,0);ctx.stroke();
      ctx.fillStyle='#e8e4d8';ctx.fillRect(r*.86,-3,r*.14,6);ctx.fillStyle='#080808';ctx.beginPath();ctx.arc(0,0,r*.11,0,TAU);ctx.fill();ctx.strokeStyle='#e8e4d8';ctx.stroke();
      ctx.fillStyle='#cc1515';ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.fill();ctx.restore();
      ctx.save();ctx.fillStyle='#8d8c84';ctx.font='11px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText('12 / MECHANICAL RHYTHM',w/2,h-17);ctx.restore();
    }
  };
}
  const root=document.getElementById('tsugumori-eight-studies');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('stage'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const study=makeRhythmWheel();
  const title="MECHANICAL RHYTHM";
  const hint="Place pins around the wheel. Sound starts off.";
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
  function act(key,value){const result=module().action(key,value);if(paused&&false){module().update(.033,time);}if(result&&result.download)download(result.download);syncControls();report();draw();schedule();}
  function download(data){try{const blob=new Blob([data.content],{type:data.type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=data.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('status').textContent='Download is unavailable in this viewer.';}}
  function draw(){if(!W||!H)return;ctx.clearRect(0,0,W,H);ctx.fillStyle='#080808';ctx.fillRect(0,0,W,H);ctx.save();module().draw(ctx,W,H,time);ctx.restore();}
  function run(now){raf=0;if(last!==null&&now-last<1000/30){schedule();return;}const dt=last===null?0:Math.min((now-last)/1000,.06);last=now;time+=dt;module().update(dt,time);draw();report();if(time-syncTime>.2){syncControls();syncTime=time;}schedule();}
  function schedule(){if(!paused&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(run);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;module().suspend?.();if(bindings.size)syncControls();}
  function initializeScene(){captured=false;$('title').textContent=title;$('hint').textContent=hint;canvas.setAttribute('aria-label',title+'. '+hint+' Controls are below.');syncControls();report();draw();schedule();}
  function pauseLabel(){$('pause').textContent=paused?'PLAY':'PAUSE';$('pause').setAttribute('aria-label',paused?'Play animation':'Pause animation');}
  $('pause').addEventListener('click',()=>{paused=!paused;pauseLabel();if(paused)stop();else schedule();syncControls();$('status').textContent=paused?'Animation paused.':'Animation playing.';});
  function pos(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/W)),Math.max(0,Math.min(1,(e.clientY-r.top)/H))];}
  function pointer(kind,e){const p=pos(e);module().pointer?.(kind,...p);if(paused&&kind==='move'&&false)module().update(.033,time);if(kind!=='move'||captured)syncControls();if(kind==='up'||kind==='down')report();draw();}
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
