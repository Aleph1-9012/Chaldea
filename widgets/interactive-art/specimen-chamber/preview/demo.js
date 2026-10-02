// SPDX-License-Identifier: 0BSD
(() => {
 'use strict';
 const root=document.getElementById('ts-play-lab');
 const $=s=>root.querySelector(s), $$=s=>Array.from(root.querySelectorAll(s));
 const canvas=$('canvas'), ctx=canvas.getContext('2d');
 const TAU=Math.PI*2, clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), mix=(a,b,t)=>a+(b-a)*t;
 const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v)};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const design={grid:true,density:'Fine',accent:'#cc1515'};
 const state={mode:0,paused:reduced,time:0,visible:true,dirty:true,w:700,h:380,pointer:{x:0,y:0,inside:false,down:false},forms:[],signals:[],fossils:[]};
 const specimen={motion:.55,response:1,freeze:null,ripples:[],offsetX:0,offsetY:0};
 const orbit={selected:2,bodies:Array.from({length:5},(_,i)=>({phase:i*1.24,r:.4+i*.125,speed:(i%2?-1:1)*(.15+i*.028),spin:0})),hits:[],drag:null};
 const resonance={playing:false,energy:0,beat:'drift',intensity:.7,clock:0};
 const targets=[[28,64,76],[72,35,58],[46,82,31]], discoveries=['Scout vessel','Ribbed wanderer','The broken crown'];
 const signal={index:0,values:[50,50,50],locked:false};
 const gravity={strength:.65,count:700,center:false,second:false,particles:[],burst:0};
 const sessions=[
  {name:'Quiet engine',seed:1,bins:[.18,.2,.38,.83,.9,.89,.8,.42,.2],detail:'Sample · 142 minutes · 3 projects · 8 switches'},
  {name:'Branching hours',seed:4,bins:[.2,.83,.27,.96,.2,.86,.36,.88,.1],detail:'Sample · 98 minutes · 6 projects · 31 switches'},
  {name:'After midnight',seed:8,bins:[.12,.18,.32,.36,.4,.61,.76,.51,.2],detail:'Sample · 67 minutes · 2 projects · 5 switches'}
 ];
 const fossil={session:0,rotation:25,name:sessions[0].name,drag:null};
 const names=['Specimen chamber','Orbital playground','Resonance sculpture','Signal hunting','Gravity sandbox','Session fossils'];
 const gestures=['Move to attract · Click to send a ripple','Drag a body, then let go · Click to select','Bass squeezes the ring · Percussion ripples the rim','Tune the three dials until the hidden shape resolves','Hold and drag to pull · Release to scatter · Esc clears wells','Drag to rotate · Name a shape and keep it'];
 let last=0, shutterAnimation;
 function dirty(){state.dirty=true}
 function status(text){$('[data-status]').textContent=text;dirty()}
 function output(key,text){$('[data-output="'+key+'"]').textContent=text}
 function button(key){return $('[data-action="'+key+'"]')}
 function accent(alpha=1){const c=design.accent;return `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},${alpha})`}
 const bone=a=>`rgba(232,232,232,${a})`;
 function line(points,color,width=1){if(points.length<2)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
 function dot(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
 function text(str,x,y,color=bone(.62),align='left',size=11){ctx.font=size+'px "Share Tech Mono", monospace';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y)}
 function project(x,y,z,scale,angle=.4,tilt=.25,cx=state.w/2,cy=state.h/2+5){const x1=x*Math.cos(angle)+z*Math.sin(angle),z1=-x*Math.sin(angle)+z*Math.cos(angle);const y1=y*Math.cos(tilt)-z1*Math.sin(tilt),z2=y*Math.sin(tilt)+z1*Math.cos(tilt);const p=4.8/(4.8+z2);return{x:cx+x1*scale*p,y:cy+y1*scale*p,z:z2,p}}
 function background(){const{w,h}=state;ctx.clearRect(0,0,w,h);ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,w,h);if(design.grid){ctx.strokeStyle=accent(.1);ctx.lineWidth=.65;ctx.beginPath();for(let x=0;x<w;x+=20){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,h)}for(let y=0;y<h;y+=20){ctx.moveTo(0,y+.5);ctx.lineTo(w,y+.5)}ctx.stroke()}
  ctx.strokeStyle=accent(.38);ctx.beginPath();const m=16,l=12;[[m,36,1,1],[w-m,36,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.moveTo(x+sx*l,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*l)});ctx.stroke();
  for(let i=0;i<9;i++){const y=58+i*(h-100)/8;line([{x:8,y},{x:i%2?11:14,y}],accent(.4))}
 }
 function specimenGeometry(time,ox,oy){const scale=Math.min(state.w*.225,state.h*.39),ribs=design.density==='Fine'?78:44,pts=[];const phase=time*specimen.motion*1.45;const spine=[];
  for(let j=0;j<=ribs;j++){const u=j/ribs,s=u*2-1,env=Math.pow(Math.max(0,Math.sin(Math.PI*u)),.7);const sway=Math.sin(s*3.2-phase)*(.12+specimen.motion*.24);const cx=s*1.75+ox*env,cy=sway+oy*env,cz=.28*Math.cos(s*3.8-phase*.68);spine.push(project(cx,cy,cz,scale,.35+Math.sin(phase*.16)*.28,.4));
   let pulse=0;for(const wave of specimen.ripples){const age=time-wave;const pos=age*.62;if(age>=0&&age<2.4)pulse+=.2*Math.exp(-65*(u-pos)*(u-pos))*Math.exp(-age*.35)}
   const radius=env*(.28+.07*Math.sin(u*9-phase))+pulse;const rib=[];
   for(let k=0;k<=23;k++){const a=-Math.PI*.89+k/23*Math.PI*1.78;const p=project(cx+.10*env*Math.cos(a),cy+radius*Math.cos(a),cz+radius*.82*Math.sin(a),scale,.35+Math.sin(phase*.16)*.28,.4);rib.push(p);pts.push({...p,r:k%4===0?1.15:.65,a:.2+(.7-p.z*.18)*(.5+.5*env)})}
   line(rib,bone(.16+.16*env),.65);
   if(j%2===0){const tip=rib[0],tip2=rib[rib.length-1];const fin=project(cx-.18*env,cy+radius*Math.cos(-Math.PI*.89)*1.8,cz+radius*Math.sin(-Math.PI*.89)*1.9,scale,.35+Math.sin(phase*.16)*.28,.4);line([tip,fin,tip2],bone(.1),.55)}
  }
  line(spine,bone(.82),1);pts.sort((a,b)=>b.z-a.z).forEach(p=>dot(p.x,p.y,p.r,bone(clamp(p.a,.12,.9))));const head=spine[spine.length-1];dot(head.x,head.y,2.4,accent());return spine;
 }
 function drawSpecimen(dt){const f=specimen.freeze;const time=f?f.time:state.time;const targetX=state.pointer.inside?(state.pointer.x/state.w-.5)*.64*specimen.response:0,targetY=state.pointer.inside?(state.pointer.y/state.h-.5)*.62*specimen.response:0;if(!f){specimen.offsetX=mix(specimen.offsetX,targetX,dt?Math.min(1,dt*3):.12);specimen.offsetY=mix(specimen.offsetY,targetY,dt?Math.min(1,dt*3):.12)}
  specimenGeometry(time,f?f.ox:specimen.offsetX,f?f.oy:specimen.offsetY);text(f?'FORM HELD / '+String(f.id).padStart(2,'0'):'LIVE SPECIMEN / 01',26,state.h-28,accent(.95));text(f?'RELEASE TO WAKE':'POINTER / '+(specimen.response===1?'ATTRACT':'REPEL'),state.w-26,state.h-28,bone(.5),'right');
  if(state.pointer.inside&&!f){const{x,y}=state.pointer;line([{x:x-7,y},{x:x+7,y}],accent(.7));line([{x,y:y-7},{x,y:y+7}],accent(.7));ctx.strokeStyle=accent(.17);ctx.beginPath();ctx.arc(x,y,23,0,TAU);ctx.stroke()}
 }
 function orbitPoint(i,phase,r){const max=Math.min(state.w*.38,state.h*.45);const a=phase,tilt=-.20+i*.14;const x=Math.cos(a)*max*r,y=Math.sin(a)*max*r*.47;return{x:state.w/2+x*Math.cos(tilt)-y*Math.sin(tilt),y:state.h/2+4+x*Math.sin(tilt)+y*Math.cos(tilt),z:Math.sin(a)}}
 function sphere(x,y,r,active,angle){const points=[];for(let j=1;j<10;j++){const lat=-Math.PI/2+j/10*Math.PI,ring=[];for(let k=0;k<=32;k++){const a=k/32*TAU+angle,p=project(Math.cos(lat)*Math.cos(a),Math.sin(lat),Math.cos(lat)*Math.sin(a),r,.35,.2,x,y);ring.push(p);if(k%2===0)points.push(p)}line(ring,active?accent(.55):bone(.23),.65)}for(let k=0;k<8;k++){const a=k/8*TAU+angle,path=[];for(let j=0;j<=20;j++){const lat=-Math.PI/2+j/20*Math.PI;path.push(project(Math.cos(lat)*Math.cos(a),Math.sin(lat),Math.cos(lat)*Math.sin(a),r,.35,.2,x,y))}line(path,active?accent(.37):bone(.16),.6)}points.sort((a,b)=>b.z-a.z).forEach(p=>dot(p.x,p.y,.75,active?accent(.9):bone(.5)));if(active){ctx.strokeStyle=accent(.75);ctx.lineWidth=.7;ctx.beginPath();ctx.arc(x,y,r+5,0,TAU);ctx.stroke()}}
 function shapePoint(index,u,v){if(index===0){const x=(u*2-1)*1.62,env=Math.pow(Math.max(.001,Math.sin(Math.PI*u)),.55);return[x,.42*env*Math.cos(v*TAU),.46*env*Math.sin(v*TAU)*(u>.6?1.2:1)]}if(index===1){const a=u*TAU,r=.7+.21*Math.cos(5*a);return[r*Math.cos(a),r*Math.sin(a),Math.sin(v*TAU)*.44+.13*Math.sin(9*a)]}const a=u*TAU,r=.48+.45*(Math.floor(u*7)%2);return[r*Math.cos(a)*1.3,r*Math.sin(a),.2*Math.sin(v*TAU)]}
 function makeParticles(){gravity.particles=Array.from({length:gravity.count},(_,i)=>({x:noise(i*5+10)*state.w,y:36+noise(i*5+11)*(state.h-60),vx:(noise(i*5+12)-.5)*24,vy:(noise(i*5+13)-.5)*24,history:[]}));dirty()}
 function burst(x,y,power=90){for(const p of gravity.particles){const dx=p.x-x,dy=p.y-y,d=Math.max(15,Math.hypot(dx,dy));p.vx+=dx/d*power;p.vy+=dy/d*power}gravity.burst=state.time;dirty()}
 function wells(){const all=[];if(state.pointer.down)all.push({x:state.pointer.x,y:state.pointer.y});else if(gravity.center)all.push({x:state.w*.5,y:state.h*.5});if(gravity.second)all.push({x:state.w*.73,y:state.h*.36});return all}
 const drawScene=drawSpecimen;
 function needsMotion(){return [!specimen.freeze,true,resonance.playing||resonance.energy>.002,!signal.locked,true,false][state.mode]}
 function tick(stamp){if(!root.isConnected)return;const raw=last?Math.min(.04,(stamp-last)/1000):0;last=stamp;const animate=state.visible&&!document.hidden&&!state.paused&&needsMotion();if(state.visible&&!document.hidden&&(animate||state.dirty)){const dt=animate?raw:0;if(animate)state.time+=dt;background();drawScene(dt);state.dirty=false}requestAnimationFrame(tick)}
 function resize(){const r=canvas.getBoundingClientRect(),oldW=state.w,oldH=state.h;state.w=r.width;state.h=r.height;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);for(const p of gravity.particles){p.x*=state.w/oldW;p.y*=state.h/oldH;p.history=[]}dirty()}
 function updateMotion(){button('motion').textContent=state.paused?'Resume motion':'Pause motion';button('motion').setAttribute('aria-pressed',String(state.paused));dirty()}
 function updateOrbit(){const b=orbit.bodies[orbit.selected];$('[data-input="workspace"]').value=String(orbit.selected);$('[data-input="orbit"]').value=String(Math.round(b.r*100));output('orbit',Math.round(b.r*100)+'%');status('Preview workspace '+String(orbit.selected+1).padStart(2,'0')+' selected. Your real workspaces stay unchanged.')}
 function updateSignal(announce=true){signal.locked=signal.values.every((v,i)=>Math.abs(v-targets[signal.index][i])<=5);signal.values.forEach((v,i)=>{const diff=Math.abs(v-targets[signal.index][i]),quality=diff<=5?'matched':diff<=14?'warm':'cold';output('tune'+i,v+' · '+quality);$('[data-tune="'+i+'"]').value=v;$('[data-quality="'+i+'"]').style.width=(100-Math.min(100,diff*2))+'%'});button('assist').disabled=signal.locked;button('collect').disabled=!signal.locked||state.signals.includes(signal.index);button('collect').textContent=state.signals.includes(signal.index)?'Collected':'Collect discovery';if(announce)status(signal.locked?discoveries[signal.index]+' found. Collect it to keep a discovery card.':'Tune until every dial reads matched. Assist solves one dial.');dirty()}
 function initializeScene(){const mode=state.mode;if(state.pointer.down){state.pointer.down=false;orbit.drag=null;fossil.drag=null}state.pointer.inside=false;$$('[data-controls]').forEach(p=>p.hidden=+p.dataset.controls!==mode);$('[data-title]').textContent=names[mode];$('[data-gesture]').textContent=gestures[mode];canvas.setAttribute('aria-label',names[mode]+'. '+gestures[mode]+'. Equivalent controls are below.');const messages=['Specimen awake. Kept forms stay in this preview only.','Drag changes the orbit. Workspace selection is simulated.','Silent demo signal. This does not read your music player.','Tune until every dial reads matched. Assist solves one dial.','Hold inside the field or use Hold center well. Escape releases all wells.',sessions[fossil.session].detail+' · no activity tracked.'];status(messages[mode]);if(mode===1)updateOrbit();if(mode===3)updateSignal();if(mode===0&&specimen.freeze)status('Form '+String(specimen.freeze.id).padStart(2,'0')+' held. Release specimen to wake it.');if(!reduced){if(shutterAnimation)shutterAnimation.cancel();shutterAnimation=$('.ts-shutter').animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:390,easing:'cubic-bezier(.16,1,.3,1)'})}dirty()}
 function archiveChip(container,label,callback){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',callback);$('[data-archive="'+container+'"]').appendChild(b);return b}
 function holdForm(f){specimen.freeze=f;specimen.motion=f.motion;specimen.ripples=f.ripples.slice();$('[data-input="motion"]').value=f.motion*100;output('motion',Math.round(f.motion*100)+'%');button('release-form').hidden=false;button('save-form').disabled=true;status('Form '+String(f.id).padStart(2,'0')+' held. Kept in this preview only.')}
 function releaseForm(){specimen.freeze=null;specimen.ripples=[];button('release-form').hidden=true;button('save-form').disabled=state.forms.length>=6;status('Specimen released. Move the pointer or send a ripple.');dirty()}
 function setFossil(sample,rotation,name){fossil.session=sample;fossil.rotation=rotation;fossil.name=name;$('[data-input="session"]').value=sample;$('[data-input="rotation"]').value=rotation;$('[data-input="fossil-name"]').value=name;output('rotation',Math.round(rotation)+'°');button('archive-fossil').disabled=false;status(sessions[sample].detail+' · sample data only.')}
 function releaseWells(){const all=wells();state.pointer.down=false;gravity.center=false;gravity.second=false;for(const w of all)burst(w.x,w.y,70);button('well').setAttribute('aria-pressed','false');button('well').textContent='Hold center well';button('second-well').setAttribute('aria-pressed','false');button('second-well').textContent='Add second well';status('Wells released. Particles are drifting.')}
 const actions={
  motion(){state.paused=!state.paused;updateMotion();status(state.paused?'Motion paused. Controls still work.':'Motion resumed.')},
  ripple(){if(specimen.freeze)releaseForm();specimen.ripples.push(state.time);specimen.ripples=specimen.ripples.filter(t=>state.time-t<3);if(state.paused){state.time+=.7;dirty()}status('A ripple is travelling along the spine.')},
  'save-form'(){if(state.forms.length>=6)return;const f={id:state.forms.length+1,time:state.time,ox:specimen.offsetX,oy:specimen.offsetY,motion:specimen.motion,ripples:specimen.ripples.slice()};state.forms.push(f);archiveChip('forms','Form '+String(f.id).padStart(2,'0'),()=>holdForm(f));holdForm(f)},
  'release-form':releaseForm,
  'orbit-impulse'(){orbit.bodies[orbit.selected].speed*=1.65;if(Math.abs(orbit.bodies[orbit.selected].speed)>1.2)orbit.bodies[orbit.selected].speed=Math.sign(orbit.bodies[orbit.selected].speed)*1.2;orbit.bodies[orbit.selected].phase+=.28;status('Impulse applied to preview workspace '+String(orbit.selected+1).padStart(2,'0')+'.');dirty()},
  'orbit-reverse'(){orbit.bodies[orbit.selected].speed*=-1;orbit.bodies[orbit.selected].phase+=.08;status('Orbit direction reversed.');dirty()},
  music(){resonance.playing=!resonance.playing;if(resonance.playing&&state.paused){state.paused=false;updateMotion()}button('music').textContent=resonance.playing?'Pause demo beat':'Play demo beat';button('music').setAttribute('aria-pressed',String(resonance.playing));status(resonance.playing?'Silent simulated beat playing. Bass compresses the ring; percussion sends ripples.':'Demo paused. The sculpture settles into a still ring.');dirty()},
  assist(){const i=signal.values.findIndex((v,j)=>Math.abs(v-targets[signal.index][j])>5);if(i>=0)signal.values[i]=targets[signal.index][i];updateSignal()},
  collect(){if(!signal.locked||state.signals.includes(signal.index))return;const i=signal.index;state.signals.push(i);archiveChip('signals',String(i+1).padStart(2,'0')+'// '+discoveries[i],()=>{signal.index=i;signal.values=targets[i].slice();updateSignal();status(discoveries[i]+' · collected in this preview.')});updateSignal(false);status(discoveries[i]+' collected. Choose Next signal to search again.')},
  'next-signal'(){signal.index=(signal.index+1)%targets.length;signal.values=[50,50,50];updateSignal()},
  well(){if(gravity.center){gravity.center=false;burst(state.w/2,state.h/2)}else gravity.center=true;button('well').setAttribute('aria-pressed',String(gravity.center));button('well').textContent=gravity.center?'Release + burst':'Hold center well';status(gravity.center?'Center well held. Release it to throw the particles outward.':'Center well released.');dirty()},
  'second-well'(){gravity.second=!gravity.second;button('second-well').setAttribute('aria-pressed',String(gravity.second));button('second-well').textContent=gravity.second?'Remove second well':'Add second well';if(!gravity.second)burst(state.w*.73,state.h*.36,60);status(gravity.second?'Second well added. The two fields compete.':'Second well removed.');dirty()},
  scatter(){releaseWells();burst(state.w/2,state.h/2,160);status('Particles scattered. Hold anywhere to gather them again.')},
  'archive-fossil'(){const name=$('[data-input="fossil-name"]').value.trim();if(!name){status('Give the fossil a name first.');$('[data-input="fossil-name"]').focus();return}if(state.fossils.length>=6){status('Six fossils kept in this preview. Select one below to revisit it.');return}const f={sample:fossil.session,rotation:fossil.rotation,name};state.fossils.push(f);archiveChip('fossils',String(state.fossils.length).padStart(2,'0')+'// '+name,()=>{setFossil(f.sample,f.rotation,f.name);button('archive-fossil').disabled=true;status('Viewing '+f.name+'. Archive is kept in this preview only.')});button('archive-fossil').disabled=true;status(name+' archived. Kept in this preview only.')}
 };
 $$('[data-action]').forEach(b=>b.addEventListener('click',()=>actions[b.dataset.action]()));
 $$('[data-input]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.input,value=el.value;
  if(key==='response'){specimen.response=+value;$('[data-gesture]').textContent='Move to '+(+value===1?'attract':'repel')+' · Click to send a ripple';dirty()}
  if(key==='motion'){if(specimen.freeze)releaseForm();specimen.motion=+value/100;output('motion',value+'%')}
  if(key==='workspace'){orbit.selected=+value;updateOrbit()}
  if(key==='orbit'){orbit.bodies[orbit.selected].r=+value/100;output('orbit',value+'%')}
  if(key==='beat'){resonance.beat=value;status('Demo pattern changed. No sound or player connection.')}
  if(key==='intensity'){resonance.intensity=+value/100;output('intensity',value+'%')}
  if(key==='gravity'){gravity.strength=+value/100;output('gravity',value+'%')}
  if(key==='particles'){gravity.count=+value;output('particles',value);makeParticles()}
  if(key==='session'){setFossil(+value,25,sessions[+value].name)}
  if(key==='rotation'){fossil.rotation=+value;output('rotation',value+'°');button('archive-fossil').disabled=false}
  if(key==='fossil-name'){fossil.name=value;button('archive-fossil').disabled=false}
  dirty();
 }));
 $$('[data-tune]').forEach(el=>el.addEventListener('input',()=>{signal.values[+el.dataset.tune]=+el.value;updateSignal()}));
 function pointer(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top}}
 canvas.addEventListener('pointermove',e=>{const p=pointer(e);state.pointer.x=p.x;state.pointer.y=p.y;state.pointer.inside=true;if(orbit.drag&&state.mode===1){const d=orbit.drag;d.distance=Math.max(d.distance,Math.hypot(p.x-d.start.x,p.y-d.start.y));if(d.distance>6){const b=orbit.bodies[d.index],tilt=-.2+d.index*.14,dx=p.x-state.w/2,dy=p.y-state.h/2-4,x=dx*Math.cos(tilt)+dy*Math.sin(tilt),y=-dx*Math.sin(tilt)+dy*Math.cos(tilt),max=Math.min(state.w*.38,state.h*.45);b.phase=Math.atan2(y/.47,x);b.r=clamp(Math.hypot(x,y/.47)/max,.3,1);const elapsed=Math.max(.016,(e.timeStamp-d.lastStamp)/1000),delta=Math.atan2(Math.sin(b.phase-d.lastPhase),Math.cos(b.phase-d.lastPhase));d.velocity=mix(d.velocity,clamp(delta/elapsed,-1.2,1.2),.6);d.lastPhase=b.phase;d.lastStamp=e.timeStamp;output('orbit',Math.round(b.r*100)+'%');$('[data-input="orbit"]').value=b.r*100}}if(fossil.drag&&state.mode===5){fossil.rotation=((fossil.drag.rotation+(p.x-fossil.drag.x)*.65)%360+360)%360;$('[data-input="rotation"]').value=Math.round(fossil.rotation);output('rotation',Math.round(fossil.rotation)+'°');button('archive-fossil').disabled=false}dirty()});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=pointer(e);state.pointer={...p,inside:true,down:true};canvas.setPointerCapture(e.pointerId);if(state.mode===0)actions.ripple();if(state.mode===1){const hit=orbit.hits.reduce((best,p)=>{const distance=Math.hypot(p.x-state.pointer.x,p.y-state.pointer.y);return distance<Math.max(p.r+10,24)&&(!best||distance<best.distance)?{...p,distance}:best},null);if(hit){orbit.selected=hit.i;orbit.drag={index:hit.i,start:p,distance:0,lastStamp:e.timeStamp,lastPhase:orbit.bodies[hit.i].phase,velocity:0};updateOrbit()}}if(state.mode===5)fossil.drag={x:p.x,rotation:fossil.rotation};dirty()});
 function pointerUp(e){if(state.mode===4&&state.pointer.down){burst(state.pointer.x,state.pointer.y);status('Well released. Hold again to catch the particles.')}if(orbit.drag&&orbit.drag.distance>6){const b=orbit.bodies[orbit.drag.index];b.speed=Math.abs(orbit.drag.velocity)>.06?orbit.drag.velocity:b.speed;status('Orbit changed. The body keeps the momentum of your release.')}state.pointer.down=false;orbit.drag=null;fossil.drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);dirty()}
 canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('pointerleave',()=>{state.pointer.inside=false;dirty()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.mode===4&&state.visible&&(state.pointer.inside||state.pointer.down||gravity.center||gravity.second||root.contains(document.activeElement))){releaseWells();e.preventDefault()}});
 document.addEventListener('visibilitychange',()=>{last=0;dirty()});new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;last=0;dirty()}).observe(root);
 function applyDesign(){root.style.setProperty('--ts-red',design.accent);dirty()}
 updateMotion();resize();initializeScene();applyDesign();requestAnimationFrame(tick);
 window.ChaldeaPreview.connect(settings => { Object.assign(design, settings); applyDesign(); });
})();
