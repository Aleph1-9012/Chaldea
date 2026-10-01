
(() => {
  const root=document.getElementById('ts-fresh-motion-studies');if(!root)return;
  const stage=root.querySelector('.wb-stage'),canvas=root.querySelector('.wb-field'),ctx=canvas.getContext('2d');
  const shell=root.querySelector('.fm-shell'),panel=root.querySelector('.wb-panel'),folio=root.querySelector('.wb-folio');
  const mask=root.querySelector('[data-panel-mask]'),trace=root.querySelector('[data-panel-trace]'),corners=root.querySelectorAll('.wb-corner');
  const glyphCanvas=root.querySelector('.wb-glyph'),glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#fm-dummy-input'),unlock=root.querySelector('.wb-unlock'),authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'),fieldName=root.querySelector('[data-field-name]'),lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'),exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'burn',panel:true,ink:100,motion:true,speed:1};
  const names={burn:'Ink exposure',aperture:'Sector aperture',comb:'Phase comb',overprint:'Glyph overprint',fault:'Fault seam'};
  const descriptions={
    burn:'A stippled ink boundary develops into a matte red field. A rough-edged wipe uncovers the center panel; unlock erases it in reverse.',
    aperture:'Six broad flat sectors close around the center. An octagonal opening reveals the panel; unlock closes the opening and releases the sectors.',
    comb:'One bank of long vertical teeth moves downward. The panel is uncovered by a matching comb mask; unlock withdraws the teeth upward.',
    overprint:'Oversized Japanese character forms move inward from the edges. A single top-to-bottom impression reveals the panel; unlock lifts the impression and withdraws the characters.',
    fault:'Four broad planar pieces slide into registration. A diagonal incision widens to reveal the panel; unlock narrows the cut and separates the pieces.'
  };
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let scene=null,sceneKey='',progress=1,sequence=null,frame=null;
  let count=0,phase=0,glyphMotion=null,glyphFrame=null,composing=false;

  // FIVE FLAT MOTION DIRECTIONS
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
function hash(x,y,seed=0) {
  let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^Math.imul(seed+1,1442695041);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
function strokePath(c,points,color,lineWidth=1,alpha=1,fraction=1) {
  if(points.length<2||alpha<=.001||fraction<=.001)return;
  c.beginPath();c.moveTo(points[0][0],points[0][1]);
  if(fraction>=.9999){for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);}
  else {let total=0;const lengths=[];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);total+=d;}let remaining=total*clamp(fraction);for(let i=1;i<points.length;i++){const length=lengths[i-1];if(remaining>=length){c.lineTo(points[i][0],points[i][1]);remaining-=length;}else{const q=length?remaining/length:0;c.lineTo(lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q));break;}}}
  c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha=clamp(alpha);c.stroke();
}
function polygon(c,points) {if(!points.length)return;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();}
function cutPolygon(points,nx,ny,limit) {
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;if(da<=0)out.push(a);if((da<0)!==(db<0)){const q=da/(da-db);out.push([lerp(a[0],b[0],q),lerp(a[1],b[1],q)]);}}return out;
}
function boundedPolygon(points) {for(const [x,y,l]of [[-1,0,0],[1,0,1],[0,-1,0],[0,1,1]])points=cutPolygon(points,x,y,l);return points;}
function makeCells(cols,rows,seed) {
  const sites=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)sites.push([(x+.5+(hash(x,y,seed)-.5)*.72)/cols,(y+.5+(hash(x,y,seed+1)-.5)*.72)/rows]);
  return sites.map((site,i)=>{let points=[[0,0],[1,0],[1,1],[0,1]];sites.forEach((other,j)=>{if(i===j)return;const nx=other[0]-site[0],ny=other[1]-site[1],limit=(other[0]**2+other[1]**2-site[0]**2-site[1]**2)/2;points=cutPolygon(points,nx,ny,limit);});return {points,center:site,key:i};});
}
function motionMask(kind,p,box={w:408,h:552}) {
  p=clamp(p);const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  if(p>=.9)return [rect(0,0,1,1)];
  if(kind==='burn') {
    const q=ramp(p,.20,.81),points=[[0,0]];for(let i=0;i<=32;i++){const y=i/32,rough=(Math.sin(y*21)*.036+(hash(i,2,17)-.5)*.09)*Math.sin(Math.PI*q);points.push([clamp(q+rough),y]);}points.push([0,1]);return [points];
  }
  if(kind==='aperture') {
    const q=ramp(p,.22,.84),r=Math.SQRT2*.60*q;
    const points=Array.from({length:8},(_,i)=>{const angle=Math.PI/8+i*Math.PI/4;return [.5+Math.cos(angle)*r,.5+Math.sin(angle)*r];});
    return [boundedPolygon(points)];
  }
  if(kind==='comb') {
    const q=ramp(p,.20,.84);return Array.from({length:16},(_,i)=>rect(i/16,0,1/16,clamp(q*1.24-(i%2)*.24)));
  }
  if(kind==='overprint')return [rect(0,0,1,ramp(p,.33,.80))];
  const a=ramp(p,.23,.83)*.5;if(a===0)return [rect(.5,.5,0,0)];let points=rect(0,0,1,1);points=cutPolygon(points,.7,.3,.5+a);points=cutPolygon(points,-.7,-.3,-.5+a);return [points];
}
function buildMotion(kind,w,h,box) {
  const s={kind,w,h,box:{...box},grains:[],sectors:[],bars:[],cells:[]};
  if(kind==='burn') {
    const step=Math.max(7,w/130),cols=Math.ceil(w/step),rows=Math.ceil(h/step);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const v=hash(x,y,17);s.grains.push({x:(x+hash(x,y,4))*step,y:(y+hash(x,y,5))*step,radius:.7+v*1.45,v});
    }
  } else if(kind==='aperture') {
    const max=Math.hypot(w,h)*1.1,inner=Math.min(w,h)*.15;
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+.02,z=(i+1)*Math.PI/3-.02;
      s.sectors.push({a,z,max,inner,delay:(i%3)*.045,color:i%2?'#33151c':'#641d28',i});
    }
  } else if(kind==='comb') {
    const count=Math.max(36,Math.round(w/11)),step=w/count;
    for(let i=0;i<count;i++){
      const v=hash(i,0,14);s.bars.push({x:i*step+1,width:step*(v>.72?.86:.48),length:h*(i%2?1.38:1.66),color:v>.84?'#8a2430':v>.44?'#581c27':'#27151d'});
    }
  } else if(kind==='fault') {
    const colors=['#481923','#28141c','#541a25','#3d1721'];
    s.cells=makeCells(2,2,71).map(cell=>({...cell,points:cell.points.map(([x,y])=>[x*w,y*h]),center:[cell.center[0]*w,cell.center[1]*h],delay:cell.key*.045,color:colors[cell.key]}));
  }
  return s;
}
function drawMotion(c,s,p,ink=1) {
  p=clamp(p);ink=clamp(ink);const {kind,w,h}=s;
  c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,w,h);c.lineJoin='miter';c.lineCap='butt';if(p===0)return;
  if(kind==='burn') {
    const q=ramp(p,.015,.77),front=lerp(-90,w+90,q),edge=y=>front+(Math.sin(y/h*15)*25+Math.sin(y/h*43)*9)*Math.sin(Math.PI*q),points=[[0,0]];
    for(let i=0;i<=64;i++)points.push([clamp(edge(h*i/64),0,w),h*i/64]);points.push([0,h]);polygon(c,points);c.fillStyle='#4d1722';c.globalAlpha=ink;c.fill();
    for(const grain of s.grains){const distance=grain.x-edge(grain.y);if(distance>24)continue;const developing=distance>-30,amount=developing?clamp((24-distance)/54):1;c.globalAlpha=amount*ink*(developing?.90:.55);c.fillStyle=developing?(grain.v>.40?'#77242f':'#080808'):(grain.v>.5?'#321019':'#601c29');c.beginPath();c.arc(grain.x,grain.y,grain.radius*(developing?1.6:1),0,Math.PI*2);c.fill();}
  } else if(kind==='aperture') {
    for(const sector of s.sectors){const q=ramp(p,sector.delay,sector.delay+.58);if(q<=0)continue;const turn=(1-q)*.23,lo=lerp(sector.max,sector.inner,q),a=sector.a+turn,z=sector.z+turn;
      const pts=[[Math.cos(a)*lo,Math.sin(a)*lo],[Math.cos(a)*sector.max,Math.sin(a)*sector.max],[Math.cos(z)*sector.max,Math.sin(z)*sector.max],[Math.cos(z)*lo,Math.sin(z)*lo]].map(([x,y])=>[w*.5+x,h*.5+y]);polygon(c,pts);c.globalAlpha=ink;c.fillStyle=sector.color;c.fill();
    }
  } else if(kind==='comb') {
    const q=ramp(p,.01,.77),head=lerp(-h*1.7,0,q);
    for(const bar of s.bars){c.globalAlpha=ink;c.fillStyle=bar.color;c.fillRect(bar.x,head,bar.width,bar.length);}
  } else if(kind==='overprint') {
    const size=Math.min(w*.64,h*.95),base=h*.87,a=ramp(p,.02,.61),b=ramp(p,.13,.71);
    c.font='500 '+size+'px "Noto Sans JP",sans-serif';c.textAlign='left';c.textBaseline='alphabetic';c.globalAlpha=ink;
    const draw=(text,x,y,q,color)=>{c.save();c.beginPath();c.rect(0,Math.max(0,h*(1-q)),w,h*q);c.clip();c.fillStyle=color;c.fillText(text,x,y);c.restore();};
    draw('継',-w*.11-(1-a)*w*.72,base,a,'#62202a');draw('衛',w*.61+(1-b)*w*.72,base,b,'#441923');
    const q=ramp(p,.10,.69);for(const yy of [h*.14,h*.49,h*.84])strokePath(c,[[0,yy],[w,yy]],'#080808',6,q);
    c.fillStyle='#9a2731';c.globalAlpha=ramp(p,.2,.72)*ink;c.fillRect(0,h*.915,w*.25,3);c.fillRect(w*.76,h*.09,w*.24,3);
  } else {
    for(const cell of s.cells){const q=ramp(p,cell.delay,cell.delay+.50);if(q<=0)continue;
      const dx=(cell.center[0]<w/2?-1:1)*(1-q)*w*.8,points=cell.points.map(([x,y])=>[lerp(cell.center[0],x,.991)+dx,lerp(cell.center[1],y,.991)]);polygon(c,points);c.globalAlpha=q*ink;c.fillStyle=cell.color;c.fill();
    }
  }
  c.globalAlpha=1;c.textAlign='left';c.textBaseline='alphabetic';
}

  // PANEL GLYPH: the approved K construction, separate from the full-screen field.
  const state={red:100};
  const ink={black:'#090909',dark:'#282724',grey:'#68665e',light:'#b7b3a8',red:'#d1161c',bright:'#ed272d'};
  function colour(t) {
    t=clamp(t*state.red/100);const a=[104,102,94],b=[209,22,28];
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
  function drawGlyph() {
    if(!glyphCtx)return;
    const side=Math.max(1,Math.round((glyphCanvas.getBoundingClientRect().width||162)*Math.min(globalThis.devicePixelRatio||1,2)));
    if(glyphCanvas.width!==side||glyphCanvas.height!==side){glyphCanvas.width=side;glyphCanvas.height=side;}
    glyphCtx.setTransform(side/252,0,0,side/252,0,0);glyphCtx.clearRect(0,0,252,252);
    glyphCtx.lineCap='butt';glyphCtx.lineJoin='miter';
    for(const mark of makeArt('k',phase))strokePath(glyphCtx,mark.points,mark.c,mark.w,mark.alpha);
    glyphCtx.globalAlpha=1;
  }
  function sampleGlyph(now) {
    if(!glyphMotion)return 1;
    const t=clamp((now-glyphMotion.started)/glyphMotion.duration);
    phase=t===1?glyphMotion.to:lerp(glyphMotion.from,glyphMotion.to,1-Math.pow(1-t,3));return t;
  }
  function glyphStep(now) {
    glyphFrame=null;if(!root.isConnected){glyphMotion=null;return;}
    const done=sampleGlyph(now)===1;drawGlyph();
    if(done)glyphMotion=null;else glyphFrame=requestAnimationFrame(glyphStep);
  }
  function animateGlyph() {
    sampleGlyph(performance.now());if(glyphFrame!==null)cancelAnimationFrame(glyphFrame);
    glyphFrame=null;glyphMotion=null;
    if(!settings.motion||preference?.matches||Math.abs(phase-count)<.00001){phase=count;drawGlyph();return;}
    glyphMotion={from:phase,to:count,started:performance.now(),duration:Math.min(700,100*Math.max(1,Math.sqrt(Math.abs(count-phase))))};
    glyphFrame=requestAnimationFrame(glyphStep);
  }

// Reversible preview timeline. No authentication or live shell integration.
function measure() {
  const bounds=stage.getBoundingClientRect(),panelBounds=panel.getBoundingClientRect(),folioBounds=folio.getBoundingClientRect();
  const w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));
  const panelW=panelBounds.width||Math.max(1,Math.min(w-32,408)),panelH=panelBounds.height||552;
  const box={x:panelBounds.width?panelBounds.left-bounds.left:(w-panelW)/2,y:panelBounds.height?panelBounds.top-bounds.top:(h-panelH)/2,w:panelW,h:panelH,folio:folioBounds.width||Math.min(panelW,w<540?64:106)};
  const key=[settings.design,w,h,...Object.values(box).map(v=>Math.round(v*10)/10)].join(':');
  if(sceneKey!==key){sceneKey=key;scene=buildMotion(settings.design,w,h,box);}
  const dpr=Math.min(globalThis.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx?.setTransform(dpr,0,0,dpr,0,0);
}
function maskPath(polygons) {
  return polygons.filter(poly=>poly.length).map(poly=>'M'+poly.map(([x,y])=>x.toFixed(5)+' '+y.toFixed(5)).join('L')+'Z').join('');
}
function paint() {
  measure();if(ctx)drawMotion(ctx,scene,progress,settings.ink/100);
  const d=maskPath(motionMask(settings.design,progress,scene.box));
  mask.setAttribute('d',d);trace.setAttribute('d',d);
  trace.style.opacity=String(['burn','comb'].includes(settings.design)?0:ramp(progress,.16,.28)*(1-ramp(progress,.84,.93)));
  shell.style.visibility=settings.panel?'visible':'hidden';
  panel.inert=!settings.panel||progress<.90||sequence?.to===0;
  input.disabled=panel.inert;unlock.disabled=panel.inert;
  panel.setAttribute('aria-hidden',String(!settings.panel||progress<.15));
  corners.forEach(el=>el.style.opacity=String(ramp(progress,.02,.14)));
}
function sample(now) {
  if(!sequence)return 1;
  const t=clamp((now-sequence.started)/sequence.duration);
  progress=t===1?sequence.to:lerp(sequence.from,sequence.to,t);return t;
}
function finish(target,moveFocus=false) {
  if(frame!==null)cancelAnimationFrame(frame);frame=null;sequence=null;progress=target;
  paint();status.textContent=names[settings.design]+(target?' · locked frame':' · cleared');
  lockState.textContent=target?'LOCKED':'LOCK RELEASED';
  if(moveFocus){if(target&&settings.panel)input.focus();else enterButton.focus();}
}
function step(now) {
  frame=null;if(!root.isConnected){sequence=null;return;}if(!sequence)return;
  const target=sequence.to,done=sample(now)===1;paint();
  if(done)finish(target,true);else frame=requestAnimationFrame(step);
}
function play(target) {
  const now=performance.now();sample(now);
  if(frame!==null)cancelAnimationFrame(frame);frame=null;sequence=null;
  if(!settings.motion||preference?.matches){finish(target,true);return;}
  if(Math.abs(progress-target)<.0001)progress=1-target;
  sequence={from:progress,to:target,started:now,duration:(target?2100:1250)*Math.abs(target-progress)/settings.speed};
  status.textContent=names[settings.design]+(target?' · appearing':' · disappearing');
  lockState.textContent=target?'LOCK / APPEAR':'UNLOCK / CLEAR';
  paint();frame=requestAnimationFrame(step);
}
function redraw() {
  fieldName.textContent=names[settings.design].toUpperCase();
  canvas.setAttribute('aria-label',descriptions[settings.design]);
  if(sequence&&(!settings.motion||preference?.matches))finish(sequence.to);
  else {sample(performance.now());paint();}
  animateGlyph();
}
root.querySelectorAll('[data-design]').forEach(button=>button.addEventListener('click',()=>{
  settings.design=button.dataset.design;
  root.querySelectorAll('[data-design]').forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.classList.toggle('active',selected);});
  stage.setAttribute('aria-labelledby',button.id);finish(1);redraw();
}));
function consumeInput() {
  const length=Math.min(input.value.length,64),start=Math.min(input.selectionStart??length,length),end=Math.min(input.selectionEnd??start,length);
  input.value='x'.repeat(length);input.setSelectionRange(start,end);
  if(length!==count){count=length;animateGlyph();}authStatus.textContent='PREVIEW ONLY';
}
input.addEventListener('compositionstart',()=>{composing=true;});
input.addEventListener('compositionend',()=>{composing=false;consumeInput();});
input.addEventListener('input',event=>{if(!composing&&!event.isComposing)consumeInput();});
input.addEventListener('keydown',event=>{
  if(composing||event.isComposing)return;
  if(event.key==='Enter'){event.preventDefault();play(0);}
  if(event.key==='Escape'){event.preventDefault();input.value='';consumeInput();}
});
unlock.addEventListener('click',()=>play(0));
enterButton.addEventListener('click',()=>play(1));exitButton.addEventListener('click',()=>play(0));
preference?.addEventListener?.('change',redraw);
finish(1);redraw();
if(typeof ResizeObserver==='function') {
  const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}redraw();});
  observer.observe(stage);observer.observe(panel);observer.observe(glyphCanvas);
}
document.fonts?.load?.('500 64px "Noto Sans JP"','継衛').then(()=>{if(root.isConnected)redraw();}).catch(()=>{});
document.fonts?.ready.then(()=>{if(root.isConnected)redraw();});
if(globalThis.Tweak) {
  const tweak=new Tweak({container:stage,onChange:redraw});
  tweak.addToggle(settings,'panel',{label:'Show center box'});
  tweak.addSlider(settings,'ink',{label:'Background ink',min:55,max:100,step:5,unit:'%'});
  tweak.addSlider(settings,'speed',{label:'Playback speed',min:.5,max:1.5,step:.25,unit:'×'});
  tweak.addToggle(settings,'motion',{label:'Animations'});
}

})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"fault\"]"}], "remove": ["button[data-design]"], "controls": false});
