
(() => {
  const root=document.getElementById('ts-procedural-motion');if(!root)return;
  const stage=root.querySelector('.wb-stage'),canvas=root.querySelector('.wb-field'),ctx=canvas.getContext('2d');
  const shell=root.querySelector('.sm-shell'),panel=root.querySelector('.wb-panel'),folio=root.querySelector('.wb-folio');
  const registerCanvas=root.querySelector('.sm-register'),registerCtx=registerCanvas.getContext('2d'),corners=root.querySelectorAll('.wb-corner');
  const userHead=root.querySelector('.wb-user-head'),clockStrip=root.querySelector('.wb-clock-strip'),auth=root.querySelector('.wb-auth');
  const folioLabels=[root.querySelector('.wb-folio-top'),root.querySelector('.wb-title'),root.querySelector('.wb-folio-bottom')];
  const glyphCanvas=root.querySelector('.wb-glyph'),glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#sm-dummy-input'),unlock=root.querySelector('.wb-unlock'),authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'),fieldName=root.querySelector('[data-field-name]'),lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'),exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'phase',panel:true,ink:100,motion:true,speed:1};
  const names={phase:'Phase lock',interference:'Interference',tissue:'Ena strain'};
  const descriptions={
    phase:'Short glyph fragments divide, adjust their joints, and settle in place. The center panel and its K glyph activate in the same sequence. Unlock releases the fragments locally.',
    interference:'Two fine line fields change spacing and phase. Small red sections settle into alignment while the center panel rules register in place. Unlock breaks that alignment.',
    tissue:'Cropped porous ribbons change local tension. Fine hatch bridges straighten and embedded red strands shift while the panel rules resolve in place. Unlock relaxes and thins the engraving.'
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
function segment(points,from,to){
  const out=[];if(to<=from||points.length<2)return out;
  const a=clamp(from)*(points.length-1),b=clamp(to)*(points.length-1);
  const sample=n=>{const i=Math.min(points.length-2,Math.floor(n)),q=n-i;return [lerp(points[i][0],points[i+1][0],q),lerp(points[i][1],points[i+1][1],q)];};
  out.push(sample(a));for(let i=Math.floor(a)+1;i<b;i++)out.push(points[i]);out.push(sample(b));return out;
}
function polygon(c,pts){if(pts.length<3)return;c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();}
function buildSystem(kind,w,h,box){
  const s={kind,w,h,box:{...box},cells:[],ribbons:[]};
  if(kind==='phase'){
    const size=84,cols=Math.ceil(w/size),rows=Math.ceil(h/size),ox=(w-cols*size)/2,oy=(h-rows*size)/2;
    function cell(x,y,size,key,depth){const node={x,y,size,key,depth,angle:Math.floor(hash(key,depth,27)*4)*Math.PI/2,children:[]};if(depth<2&&hash(key,depth,34)>(depth===0?.19:.58))for(let i=0;i<4;i++)node.children.push(cell(x+(i%2?1:-1)*size/4,y+(i<2?-1:1)*size/4,size/2,key*5+i+1,depth+1));return node;}
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)s.cells.push(cell(ox+(x+.5)*size,oy+(y+.5)*size,size,y*cols+x+1,0));
  }
  if(kind==='tissue'){
    for(let i=0;i<3;i++){
      const left=i!==1;
      s.ribbons.push({id:i,side:left?-1:1,baseX:w*(i===0?.135:i===1?.88:.055),baseWidth:Math.max(42,Math.min(102,w*(i===2?.053:.086))),offset:i*2.31,branch:i===2,
        pores:Array.from({length:i===2?42:80},(_,j)=>({t:.025+hash(j,i,42)*.95,u:(hash(j,i,43)-.5)*1.9,a:9+hash(j,i,44)*35,b:4+hash(j,i,45)*18,key:j})),
        fibers:Array.from({length:120},(_,j)=>({u:(hash(j,i,36)-.5)*1.96,v:hash(j,i,40),start:hash(j,i,37)*.91,length:.025+hash(j,i,38)*.16})),
        hatches:Array.from({length:410},(_,j)=>({t:hash(j,i,31),u:(hash(j,i,32)-.5)*1.95,v:hash(j,i,33)})),
        speckles:Array.from({length:900},(_,j)=>({t:hash(j,i,21),u:(hash(j,i,22)-.5)*2,v:hash(j,i,23)}))});
    }
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
    strokePath(c,part,tint,.72,alpha*strength*(red?.82:.47),local);
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
function interferencePoint(s,x,y,layer,p){
  const {w,h}=s,u=x/w,v=y/h,settle=ramp(p,.04,.80),transient=1-settle;
  const a=Math.exp(-((u-.16)**2/.045+(v-.27)**2/.19)),b=Math.exp(-((u-.89)**2/.044+(v-.76)**2/.20));
  const phase=transient*(layer?2.1:-1.7),warp=(a*Math.sin(v*6.7+phase)+b*Math.sin(v*7.9-1.2-phase))*Math.min(62,w*.065);
  const bend=layer?(Math.sin(v*5.3+phase)*11+warp*.45):warp;
  return [x+bend,y+(layer?Math.sin(u*7.1-phase)*7:0)];
}
function drawInterference(c,s,p,strength){
  const {w,h}=s,alive=ramp(p,.01,.19),settle=ramp(p,.02,.84),spacing=6.1;
  for(let layer=0;layer<2;layer++){
    const count=Math.ceil(w/spacing)+28;
    for(let i=0;i<count;i++){
      const offset=layer?(2.4+(1-settle)*8.2):0,x=(i-14)*spacing+offset;
      const points=[];for(let j=0;j<=66;j++){const y=-24+(h+48)*j/66;points.push(interferencePoint(s,x,y,layer,p));}
      const band=(Math.sin(i*.12+layer)*.5+.5),alpha=(layer?.16:.22)*alive*strength*(.68+band*.32);
      strokePath(c,points,'#b4afa1',.70,alpha);
      if(layer===1&&i%39===18){
        const center=.20+(i%5)*.145+(1-settle)*.16,range=.055;
        strokePath(c,segment(points,center-range,center+range),'#c41920',1.05,alive*strength*.74);
      }
    }
  }
}
function ribbonFrame(s,r,t,p){
  const q=ramp(p,.02,.81),loose=1-q,{w,h}=s;
  let x=r.baseX+Math.sin(t*5.6+r.offset)*w*.042+Math.sin(t*11.4+r.offset)*w*.012;
  let y=-90+t*(h+180);
  if(r.branch){x+=w*.23*t*t;y=h*.16+t*h*.92;}
  x+=loose*(Math.sin(t*12+r.offset)*20+Math.sin(t*27)*3);
  const dx=Math.cos(t*5.6+r.offset)*w*.042*5.6+Math.cos(t*11.4+r.offset)*w*.012*11.4+(r.branch?w*.46*t:0)+loose*(Math.cos(t*12+r.offset)*240+Math.cos(t*27)*81);
  const dy=r.branch?h*.92:h+180,d=Math.hypot(dx,dy),normal=[dy/d,-dx/d];
  const width=r.baseWidth*(.70+.22*Math.sin(t*8.7+r.offset)+.10*Math.sin(t*24.5+r.offset)+.06*Math.sin(t*61.3+r.offset))*(r.branch?Math.pow(Math.max(.008,1-t),.65):1);
  return {x,y,nx:normal[0],ny:normal[1],tx:dx/d,ty:dy/d,width,q};
}
function ribbonPoint(s,r,t,u,p){const a=ribbonFrame(s,r,t,p);return [a.x+a.nx*a.width*u,a.y+a.ny*a.width*u];}
function porePath(s,r,pore,p){
  const f=ribbonFrame(s,r,pore.t,p),cx=f.x+f.nx*f.width*pore.u,cy=f.y+f.ny*f.width*pore.u;
  const stretch=lerp(.70,1.30,f.q),a=pore.a*stretch,b=pore.b/Math.sqrt(stretch),pts=[];
  for(let j=0;j<20;j++){const angle=j*Math.PI/10,irregular=1+Math.sin(angle*3+pore.key)*.11+Math.sin(angle*5+pore.key)*.06,u=Math.cos(angle)*b*irregular,v=Math.sin(angle)*a*irregular;pts.push([cx+f.nx*u+f.tx*v,cy+f.ny*u+f.ty*v]);}
  return pts;
}
function drawTissue(c,s,p,strength){
  const alive=ramp(p,.015,.24),settle=ramp(p,.02,.81);
  for(const r of s.ribbons){
    const outer=[];for(let j=0;j<=92;j++)outer.push(ribbonPoint(s,r,j/92,1,p));for(let j=92;j>=0;j--)outer.push(ribbonPoint(s,r,j/92,-1,p));
    c.save();c.beginPath();polygon(c,outer);for(const pore of r.pores)polygon(c,porePath(s,r,pore,p));
    c.globalAlpha=alive*strength;c.fillStyle='#1e1e1a';c.fill('evenodd');c.clip('evenodd');
    for(const fiber of r.fibers){const pts=[];for(let j=0;j<=15;j++){const t=fiber.start+fiber.length*j/15,u=fiber.u+Math.sin(t*39+r.id+fiber.v*3)*.075*(1-settle*.8);pts.push(ribbonPoint(s,r,t,u,p));}strokePath(c,pts,fiber.v>.87?'#b1a895':'#777264',fiber.v>.85?.72:.48,alive*strength*.40,ramp(p,fiber.v*.11,.52+fiber.v*.26));}
    for(const h of r.hatches){const a=ribbonPoint(s,r,h.t,h.u,p),b=ribbonPoint(s,r,h.t+.005+(.011*(1-settle)),h.u+(.10+h.v*.24)*(h.v>.5?1:-1),p);strokePath(c,[a,b],'#989181',.5,alive*strength*.38);}
    for(const grain of r.speckles){const pt=ribbonPoint(s,r,grain.t,grain.u,p);c.fillStyle=grain.v>.7?'#aca38f':'#625e53';c.globalAlpha=alive*strength*.29;c.fillRect(pt[0],pt[1],grain.v>.9?1.3:.65,.65);}
    for(let k=0;k<2;k++){const pts=[];for(let j=0;j<=92;j++)pts.push(ribbonPoint(s,r,j/92,(k?1:-1)*(.32+r.id*.055),p));const center=.28+k*.35+(1-settle)*.21;strokePath(c,segment(pts,center-.065,center+.065),'#c7171f',1.1,alive*strength*.80);}
    c.restore();
    for(let i=0;i<r.pores.length;i+=3)strokePath(c,segment(porePath(s,r,r.pores[i],p),.08,.39),'#9a9382',.6,alive*strength*.40);
    strokePath(c,outer.slice(0,93),'#767267',.60,alive*strength*.19,ramp(p,.06,.58));
  }
}
function drawSystem(c,s,p,strength=1){
  p=clamp(p);strength=clamp(strength);c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,s.w,s.h);c.lineCap='butt';c.lineJoin='miter';if(p===0)return;
  if(s.kind==='phase')drawPhase(c,s,p,strength);else if(s.kind==='interference')drawInterference(c,s,p,strength);else drawTissue(c,s,p,strength);
  c.globalAlpha=1;
}
function componentState(kind,p){
  const late=kind==='tissue'?.04:kind==='interference'?.07:0;
  return {back:ramp(p,.10,.35),border:ramp(p,.18,.73),folio:ramp(p,.28+late,.67+late),folioText:ramp(p,.49+late,.76+late),user:ramp(p,.41+late,.68+late),clock:ramp(p,.48+late,.74+late),glyph:ramp(p,.22+late,.73+late),auth:ramp(p,.59+late,.87+late)};
}
function drawRegister(c,s,p){
  c.clearRect(0,0,s.w,s.h);if(p<=0||p>=1)return;
  const {x,y,w,h,folio}=s.box,q=componentState(s.kind,p),active=ramp(p,.06,.17)*(1-ramp(p,.78,.97)),red='#b91a20',grey='#999486';
  const corners=[[[x,y+32],[x,y],[x+32,y]],[[x+w-32,y],[x+w,y],[x+w,y+32]],[[x+w,y+h-32],[x+w,y+h],[x+w-32,y+h]],[[x+32,y+h],[x,y+h],[x,y+h-32]]];
  corners.forEach((pts,i)=>strokePath(c,pts,i===0||i===2?red:grey,1,active*.9,ramp(p,.05+i*.025,.29+i*.035)));
  if(s.kind==='phase'){
    for(let i=0;i<19;i++){const xx=x+(i+.5)*w/19,l=lerp(7,1,q.border);strokePath(c,[[xx,y-l],[xx,y+l]],i%6===0?red:grey,.75,active*.7);strokePath(c,[[xx,y+h-l],[xx,y+h+l]],grey,.75,active*.45);}
    strokePath(c,[[x+folio,y],[x+folio,y+h]],red,.8,active*.6,ramp(p,.18,.61));
  } else if(s.kind==='interference'){
    for(let i=0;i<7;i++){const d=(i-3)*5*(1-q.border);strokePath(c,[[x,y+d],[x+w,y+d]],i===3?red:grey,.65,active*(i===3?.6:.20));strokePath(c,[[x,y+h+d],[x+w,y+h+d]],grey,.65,active*.2);}
  } else {
    for(let side=0;side<2;side++){const pts=[];for(let j=0;j<=60;j++){const yy=y+j*h/60,xx=x+(side?w:0)+Math.sin(j*.33)*(1-q.border)*7;pts.push([xx,yy]);}strokePath(c,pts,side?grey:red,.85,active*.75,ramp(p,.10,.64));}
  }
  c.globalAlpha=1;
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
    const marks=makeArt('k',phase),q=componentState(settings.design,progress).glyph;
    for(let i=0;i<marks.length;i++){
      const mark=marks[i],local=ramp(q,hash(i,0,93)*.26,.58+hash(i,0,93)*.42);
      strokePath(glyphCtx,mark.points,mark.c,mark.w,mark.alpha*local,local);
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
  const w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));
  const panelW=panelBounds.width||Math.max(1,Math.min(w-32,408)),panelH=panelBounds.height||552;
  const box={x:panelBounds.width?panelBounds.left-bounds.left:(w-panelW)/2,y:panelBounds.height?panelBounds.top-bounds.top:(h-panelH)/2,w:panelW,h:panelH,folio:folioBounds.width||Math.min(panelW,w<540?64:106)};
  const key=[settings.design,w,h,...Object.values(box).map(v=>Math.round(v*10)/10)].join(':');
  if(sceneKey!==key){sceneKey=key;scene=buildSystem(settings.design,w,h,box);}
  const dpr=Math.min(globalThis.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx?.setTransform(dpr,0,0,dpr,0,0);
  if(registerCanvas.width!==canvas.width||registerCanvas.height!==canvas.height){registerCanvas.width=canvas.width;registerCanvas.height=canvas.height;}
  registerCtx?.setTransform(dpr,0,0,dpr,0,0);
}
function paint() {
  measure();if(ctx)drawSystem(ctx,scene,progress,settings.ink/100);
  if(registerCtx){if(settings.panel)drawRegister(registerCtx,scene,progress);else registerCtx.clearRect(0,0,scene.w,scene.h);}
  const q=componentState(settings.design,progress);
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
  corners.forEach(el=>el.style.opacity=String(ramp(progress,.28,.74)));
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
document.fonts?.ready.then(()=>{if(root.isConnected)redraw();});
if(globalThis.Tweak) {
  const tweak=new Tweak({container:stage,onChange:redraw});
  tweak.addToggle(settings,'panel',{label:'Show center box'});
  tweak.addSlider(settings,'ink',{label:'Field contrast',min:55,max:100,step:5,unit:'%'});
  tweak.addSlider(settings,'speed',{label:'Replay speed',min:.5,max:1.5,step:.25,unit:'×'});
  tweak.addToggle(settings,'motion',{label:'Animations'});
}

})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"tissue\"]"}], "remove": ["button[data-design]"], "controls": false});
