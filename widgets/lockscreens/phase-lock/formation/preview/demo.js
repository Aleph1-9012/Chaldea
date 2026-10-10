
(() => {
  const root=document.getElementById('ts-phase-formation-lock');if(!root)return;
  const stage=root.querySelector('.wb-stage'),canvas=root.querySelector('.wb-field'),ctx=canvas.getContext('2d');
  const shell=root.querySelector('.fl-shell'),panel=root.querySelector('.wb-panel'),folio=root.querySelector('.wb-folio');
  const registerCanvas=root.querySelector('.fl-register'),registerCtx=registerCanvas.getContext('2d');
  const cornerCanvas=root.querySelector('.fl-corners'),cornerCtx=cornerCanvas.getContext('2d');
  const userHead=root.querySelector('.wb-user-head'),clockStrip=root.querySelector('.wb-clock-strip'),auth=root.querySelector('.wb-auth');
  const folioLabels=[root.querySelector('.wb-folio-top'),root.querySelector('.wb-title'),root.querySelector('.wb-folio-bottom')];
  const glyphCanvas=root.querySelector('.wb-glyph'),glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#fl-dummy-input'),unlock=root.querySelector('.wb-unlock'),authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'),fieldName=root.querySelector('[data-field-name]'),lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'),exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'phase',corner:'formation',panel:true,ink:100,motion:true,speed:1};
  const cornerNames={formation:'Formation terminals'};
  const names={phase:'Phase lock'};
  const descriptions={
    phase:'Short glyph fragments divide, adjust their joints, and settle in place. The center panel and its K glyph activate in the same sequence. Unlock releases the fragments locally.'
  };
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let scene=null,sceneKey='',progress=1,sequence=null,frame=null;
  let count=0,phase=0,glyphMotion=null,glyphFrame=null,composing=false;

  // PROCEDURAL FIELDS. All movement is planar and local; no full-panel reveal mask.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
function hash(x,y,seed=0){let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^Math.imul(seed+1,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function strokePath(c,points,color,lineWidth=1,alpha=1,fraction=1){
  if(points.length<2||alpha<=.001||fraction<=.001)return;
  c.beginPath();c.moveTo(...points[0]);
  if(fraction>=.9999){for(let i=1;i<points.length;i++)c.lineTo(...points[i]);}
  else {let total=0;const lengths=[];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);total+=d;}let remaining=total*clamp(fraction);for(let i=1;i<points.length;i++){const length=lengths[i-1];if(remaining>=length){c.lineTo(...points[i]);remaining-=length;}else{const q=length?remaining/length:0;c.lineTo(lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q));break;}}}
  c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha=clamp(alpha);c.stroke();
}
// Orthogonal glyph paths use integer device-pixel widths and aligned stroke centers.
function crispStroke(c,points,color,lineWidth=1,alpha=1,fraction=1){
  if(points.length<2||alpha<=.001||fraction<=.001)return;
  const path=[points[0]],lengths=[];let total=0;
  for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);total+=d;}
  let remaining=total*clamp(fraction);
  for(let i=1;i<points.length;i++){
    const d=lengths[i-1];
    if(remaining>=d){path.push(points[i]);remaining-=d;}
    else {const q=d?remaining/d:0;path.push([lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q)]);break;}
  }
  const m=c.getTransform(),scale=Math.sqrt(Math.abs(m.a*m.d-m.b*m.c));
  const pixels=Math.max(1,Math.round(lineWidth*scale)),offset=pixels%2/2;
  const snap=v=>Math.round(v-offset)+offset;
  const raster=path.map(([x,y])=>[snap(x*m.a+y*m.c+m.e),snap(x*m.b+y*m.d+m.f)]);
  c.save();c.setTransform(1,0,0,1,0,0);
  strokePath(c,raster,color,pixels,alpha);c.restore();
}
function pixelRatio(){
  const ratio=globalThis.devicePixelRatio;
  return typeof ratio==='number'&&Number.isFinite(ratio)&&ratio>0?ratio:1;
}
function buildSystem(kind,w,h,box){
  const s={kind,w,h,box:{...box},cells:[]};
  if(kind==='phase'){
    const size=84,cols=Math.ceil(w/size),rows=Math.ceil(h/size),ox=(w-cols*size)/2,oy=(h-rows*size)/2;
    function cell(x,y,size,key,depth){const node={x,y,size,key,depth,angle:Math.floor(hash(key,depth,27)*4)*Math.PI/2,children:[]};if(depth<2&&hash(key,depth,34)>(depth===0?.19:.58))for(let i=0;i<4;i++)node.children.push(cell(x+(i%2?1:-1)*size/4,y+(i<2?-1:1)*size/4,size/2,key*5+i+1,depth+1));return node;}
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)s.cells.push(cell(ox+(x+.5)*size,oy+(y+.5)*size,size,y*cols+x+1,0));
  }
  return s;
}
function cellGlyph(c,node,cx,cy,size,alpha,p,strength){
  if(alpha<.006)return;
  const {key,depth}=node,q=ramp(p,.09+hash(key,depth,5)*.14,.65+depth*.10),shift=(1-q)*(hash(key,depth,6)-.5)*.34;
  const points=[[[ -.36,-.39],[-.36,.33],[-.12,.33]],[[-.36,-.12],[.32,-.12],[.32,.11]],[[.02+shift,-.40],[.02+shift,.35]],[[-.12,.12],[.35,.12],[.35,.40]],[[.22,-.40],[.40,-.40],[.40,-.24]]];
  const cos=Math.cos(node.angle),sin=Math.sin(node.angle),red=hash(key,depth,81)>.968;
  const tint=red?'#b71d22':'#7c796e';
  for(let i=0;i<points.length;i++){
    const local=ramp(p,.02+hash(key,i,13)*.20,.40+hash(key,i,13)*.26),part=points[i].map(([x,y])=>[cx+(x*cos-y*sin)*size,cy+(x*sin+y*cos)*size]);
    crispStroke(c,part,tint,1,alpha*strength*(red?.82:.47),local);
  }
}
function drawPhase(c,s,p,strength){
  const alive=ramp(p,0,.14);
  function branch(node,alpha=1,x=node.x,y=node.y,size=node.size){
    const split=node.children.length?ramp(p,.14+node.depth*.15+hash(node.key,1,2)*.08,.55+node.depth*.15):0;
    cellGlyph(c,node,x,y,size,alpha*(1-split)*alive,p,strength);
    if(split>0)for(const child of node.children)branch(child,alpha*split,lerp(x,child.x,split),lerp(y,child.y,split),lerp(size*.72,child.size,split));
  }
  s.cells.forEach(node=>branch(node));
}
function drawSystem(c,s,p,strength=1){
  p=clamp(p);strength=clamp(strength);c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,s.w,s.h);c.lineCap='butt';c.lineJoin='miter';if(p===0)return;
  drawPhase(c,s,p,strength);
  c.globalAlpha=1;
}
function componentState(p){
  return {back:ramp(p,.10,.35),border:ramp(p,.18,.73),folio:ramp(p,.28,.67),folioText:ramp(p,.49,.76),user:ramp(p,.41,.68),clock:ramp(p,.48,.74),glyph:ramp(p,.22,.73),auth:ramp(p,.59,.87)};
}
function drawRegister(c,s,p){
  c.clearRect(0,0,s.w,s.h);if(p<=0||p>=1)return;
  const {x,y,w,h,folio}=s.box,q=componentState(p),active=ramp(p,.06,.17)*(1-ramp(p,.78,.97)),red='#b91a20',grey='#999486';
  const corners=[[[x,y+32],[x,y],[x+32,y]],[[x+w-32,y],[x+w,y],[x+w,y+32]],[[x+w,y+h-32],[x+w,y+h],[x+w-32,y+h]],[[x+32,y+h],[x,y+h],[x,y+h-32]]];
  corners.forEach((pts,i)=>strokePath(c,pts,i===0||i===2?red:grey,1,active*.9,ramp(p,.05+i*.025,.29+i*.035)));
  if(s.kind==='phase'){
    for(let i=0;i<19;i++){const xx=x+(i+.5)*w/19,l=lerp(7,1,q.border);strokePath(c,[[xx,y-l],[xx,y+l]],i%6===0?red:grey,.75,active*.7);strokePath(c,[[xx,y+h-l],[xx,y+h+l]],grey,.75,active*.45);}
    strokePath(c,[[x+folio,y],[x+folio,y+h]],red,.8,active*.6,ramp(p,.18,.61));
  }
  c.globalAlpha=1;
}



  // OUTER CORNERS. Independent of the approved Phase field and center panel.
  const cornerDescriptions={
    formation:'Angular terminal links and a four-position formation strip.'
  };
  function drawCorners(c,s,p,lockLabel='LOCKED'){
    c.clearRect(0,0,s.w,s.h);
    const opacity=ramp(p,.28,.74);if(opacity<=.001)return;
    const compact=s.w<540,inset=compact?14:20,W=Math.min(244,(s.w-inset*2-20)/2);
    const L=inset,R=s.w-inset-W,T=14,B=s.h-58;
    const white='#e4e2dc',grey='#aaa59b',dim='#57534b',red='#d1161c',black='#080808';
    const reveal=ramp(p,.28,.74);
    c.save();c.lineCap='butt';c.lineJoin='miter';
    function block(x,y,w,h,color=black,a=1){
      c.globalAlpha=opacity*a;c.fillStyle=color;c.fillRect(x,y,w,h);
    }
    function line(points,color=dim,alpha=1){
      crispStroke(c,points,color,1,opacity*alpha,reveal);
    }
    function type(value,x,y,color=grey,size=11,weight=400,spacing=0,align='left'){
      c.font=weight+' '+size+'px "JetBrains Mono", "Noto Sans JP", monospace';
      c.textBaseline='middle';c.textAlign='left';c.fillStyle=color;c.globalAlpha=opacity;
      const chars=Array.from(value),width=chars.reduce((n,char)=>n+c.measureText(char).width,0)+Math.max(0,chars.length-1)*spacing;
      if(align==='right')x-=width;else if(align==='center')x-=width/2;
      const m=c.getTransform();x=Math.round(x*m.a)/m.a;y=Math.round(y*m.d)/m.d;
      for(const char of chars){c.fillText(char,x,y);x+=c.measureText(char).width+spacing;}
    }
    function diamond(x,y,filled=false,color=red,size=3){
      if(filled){
        c.globalAlpha=opacity;c.fillStyle=color;c.beginPath();c.moveTo(x,y-size);c.lineTo(x+size,y);c.lineTo(x,y+size);c.lineTo(x-size,y);c.closePath();c.fill();
      }else line([[x,y-size],[x+size,y],[x,y+size],[x-size,y],[x,y-size]],color);
    }
    function backing(x,y,w=W){block(x-5,y-3,w+10,50);}
    const shortLock=compact?(lockLabel==='LOCKED'?'LOCKED':lockLabel.startsWith('UNLOCK')?'RELEASE':'REGISTER'):lockLabel;

    {
      backing(L,T);backing(R,T);backing(L,B);backing(R,B);
      line([[L,T+35],[L,T+5],[L+26,T+5],[L+26,T+28],[L+10,T+28],[L+10,T+16],[L+35,T+16]],grey);
      line([[L+6,T],[L+6,T+39],[L+21,T+39]],red);
      diamond(L+26,T+5,true,red,2.5);
      type('TSUGUMORI',L+44,T+13,white,11,500,compact?0:.7);
      type('TYPE-17',L+44,T+33,grey,11);
      line([[R+W-43,T+6],[R+W,T+6],[R+W,T+38],[R+W-43,T+38]],red);
      type('704',R+W-22,T+23,red,20,500,0,'center');
      type('SID0NIA',R,T+13,white,11,500,.3);
      line([[R,T+32],[R+W-56,T+32],[R+W-56,T+22],[R+W-48,T+22]]);
      diamond(R,T+32,false,grey,2.5);
      const step=(W-18)/3;
      for(let i=0;i<4;i++){
        const x=L+9+i*step,y=B+10+(i%2?8:0);
        if(i<3)line([[x,y],[x+step*.5,y],[x+step*.5,B+10+((i+1)%2?8:0)],[x+step,B+10+((i+1)%2?8:0)]],dim);
        diamond(x,y,i===3,i===3?red:grey,3);
        type('0'+(i+1),x,B+38,i===3?red:grey,11,400,0,'center');
      }
      type(shortLock,R+W-15,B+12,white,11,500,.6,'right');
      line([[R,B+9],[R,B+33],[R+W-14,B+33],[R+W-14,B+43]],grey);
      line([[R+W-4,B+4],[R+W-4,B+25],[R+W-29,B+25]],red);
      diamond(R+W-14,B+43,true,red,3);
      if(!compact)type('LOCAL // 17',R+8,B+19,grey,11);
    }
    c.restore();c.globalAlpha=1;
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
        const tint=smooth((p*.075+.23-hash(key,depth,61))/.2);
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
    const side=Math.max(1,Math.round((glyphCanvas.getBoundingClientRect().width||162)*pixelRatio()));
    if(glyphCanvas.width!==side||glyphCanvas.height!==side){glyphCanvas.width=side;glyphCanvas.height=side;}
    glyphCtx.setTransform(side/252,0,0,side/252,0,0);glyphCtx.clearRect(0,0,252,252);
    glyphCtx.lineCap='butt';glyphCtx.lineJoin='miter';
    const marks=makeArt('k',phase),q=componentState(progress).glyph;
    for(let i=0;i<marks.length;i++){
      const mark=marks[i],local=ramp(q,hash(i,0,93)*.26,.58+hash(i,0,93)*.42);
      crispStroke(glyphCtx,mark.points,mark.c,mark.w,mark.alpha*local,local);
    }
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
  const w=Math.max(1,bounds.width),h=Math.max(1,bounds.height);
  const panelW=panelBounds.width||Math.max(1,Math.min(w-32,408)),panelH=panelBounds.height||552;
  const box={x:panelBounds.width?panelBounds.left-bounds.left:(w-panelW)/2,y:panelBounds.height?panelBounds.top-bounds.top:(h-panelH)/2,w:panelW,h:panelH,folio:folioBounds.width||Math.min(panelW,w<540?64:106)};
  const key=[settings.design,w,h,...Object.values(box).map(v=>Math.round(v*10)/10)].join(':');
  if(sceneKey!==key){sceneKey=key;scene=buildSystem(settings.design,w,h,box);}
  const dpr=pixelRatio();
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx?.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  if(registerCanvas.width!==canvas.width||registerCanvas.height!==canvas.height){registerCanvas.width=canvas.width;registerCanvas.height=canvas.height;}
  registerCtx?.setTransform(registerCanvas.width/w,0,0,registerCanvas.height/h,0,0);
  if(cornerCanvas.width!==canvas.width||cornerCanvas.height!==canvas.height){cornerCanvas.width=canvas.width;cornerCanvas.height=canvas.height;}
  cornerCtx?.setTransform(cornerCanvas.width/w,0,0,cornerCanvas.height/h,0,0);
}
function paint() {
  measure();if(ctx)drawSystem(ctx,scene,progress,settings.ink/100);
  if(registerCtx){if(settings.panel)drawRegister(registerCtx,scene,progress);else registerCtx.clearRect(0,0,scene.w,scene.h);}
  const q=componentState(progress);
  panel.style.backgroundColor='rgba(9,9,9,'+q.back+')';
  panel.style.borderColor='rgba(73,66,58,'+q.border+')';
  folio.style.backgroundColor='rgba(209,22,28,'+q.folio+')';
  folioLabels.forEach(el=>el.style.opacity=String(q.folioText));
  userHead.style.opacity=String(q.user);
  clockStrip.style.opacity=String(q.clock);
  auth.style.opacity=String(q.auth);
  shell.style.visibility=settings.panel?'visible':'hidden';
  panel.inert=!settings.panel||progress<.96||sequence?.to===0;
  input.disabled=panel.inert;unlock.disabled=panel.inert;
  panel.setAttribute('aria-hidden',String(panel.inert));
  if(cornerCtx)drawCorners(cornerCtx,scene,progress,sequence?.to===0?'UNLOCK / CLEAR':sequence?'LOCK / APPEAR':progress===1?'LOCKED':'LOCK RELEASED');
  drawGlyph();
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
  sequence={from:progress,to:target,started:now,duration:(target?1450:950)*Math.abs(target-progress)/settings.speed};
  status.textContent=names[settings.design]+(target?' · appearing':' · disappearing');
  lockState.textContent=target?'LOCK / APPEAR':'UNLOCK / CLEAR';
  paint();frame=requestAnimationFrame(step);
}
function redraw() {
  fieldName.textContent=names[settings.design].toUpperCase();
  cornerCanvas.setAttribute('aria-label',cornerNames[settings.corner]+': '+cornerDescriptions[settings.corner]);
  canvas.setAttribute('aria-label',descriptions[settings.design]);
  if(sequence&&(!settings.motion||preference?.matches))finish(sequence.to);
  else {sample(performance.now());paint();}
  animateGlyph();
}
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
let densityQuery=null;
function watchDensity(){
  densityQuery?.removeEventListener?.('change',densityChanged);
  densityQuery=typeof matchMedia==='function'?matchMedia('(resolution: '+pixelRatio()+'dppx)'):null;
  densityQuery?.addEventListener?.('change',densityChanged);
}
function densityChanged(){
  if(!root.isConnected){densityQuery?.removeEventListener?.('change',densityChanged);return;}
  watchDensity();redraw();
}
watchDensity();
document.fonts?.ready.then(()=>{if(root.isConnected)redraw();});

})();
