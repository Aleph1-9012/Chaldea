
(() => {
  const root=document.getElementById('ts-shoi-d-studies');if(!root)return;
  const stage=root.querySelector('.wb-stage'),canvas=root.querySelector('.wb-field'),ctx=canvas.getContext('2d');
  const shell=root.querySelector('.ds-shell'),panel=root.querySelector('.wb-panel'),folio=root.querySelector('.wb-folio');
  const mask=root.querySelector('[data-panel-mask]'),trace=root.querySelector('[data-panel-trace]'),corners=root.querySelectorAll('.wb-corner');
  const glyphCanvas=root.querySelector('.wb-glyph'),glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#ds-dummy-input'),unlock=root.querySelector('.wb-unlock'),authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'),fieldName=root.querySelector('[data-field-name]'),lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'),exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'docking',panel:true,ink:100,motion:true,speed:1};
  const names={docking:'Corner docking',vector:'Vector corridor',relay:'Relay gantry',tension:'Tension gate',spine:'Command spine'};
  const descriptions={
    docking:'Four linked formations dock at the box corners, opening its center seam. Unlock contracts the box before the formations detach.',
    vector:'Diagonal formation routes coordinate a planar diagonal reveal through the box. Unlock sweeps back through the same corridor.',
    relay:'Side relays trigger five alternating horizontal reveals in the box. Unlock withdraws the strips in reverse order.',
    tension:'Opposing linked trusses draw apart the upper and lower box edges. Unlock closes the gate before the links release.',
    spine:'A linked command bus raises the red folio first, then deploys the login area sideways. Unlock retracts the login area before withdrawing the folio.'
  };
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let scene=null,sceneKey='',progress=1,sequence=null,frame=null;
  let count=0,phase=0,glyphMotion=null,glyphFrame=null,composing=false;

  // STUDY ENGINE
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
  if(fraction>=.9999) {for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);}
  else {
    let total=0;const lengths=[];
    for(let i=1;i<points.length;i++){const length=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(length);total+=length;}
    let remaining=total*clamp(fraction);
    for(let i=1;i<points.length;i++) {const length=lengths[i-1];if(remaining>=length){c.lineTo(points[i][0],points[i][1]);remaining-=length;}else {const q=length?remaining/length:0;c.lineTo(lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q));break;}}
  }
  c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha=clamp(alpha);c.stroke();
}
function pointAlong(points,fraction) {
  let total=0;const lengths=[];
  for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);total+=d;}
  let distance=total*clamp(fraction);
  for(let i=1;i<points.length;i++){if(distance<=lengths[i-1]){const q=lengths[i-1]?distance/lengths[i-1]:0;return [lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q)];}distance-=lengths[i-1];}
  return points[points.length-1];
}
function halfPlane(points,threshold) {
  const out=[];
  for(let i=0;i<points.length;i++) {const a=points[i],b=points[(i+1)%points.length],da=a[0]+a[1]-threshold,db=b[0]+b[1]-threshold;if(da<=0)out.push(a);if((da<0)!==(db<0)){const q=da/(da-db);out.push([lerp(a[0],b[0],q),lerp(a[1],b[1],q)]);}}
  return out;
}
function panelShape(kind,p,folioFraction=.26) {
  p=clamp(p);const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  if(kind==='docking') {const a=ramp(p,.29,.78),v=ramp(p,.17,.32);return [rect(.5-a*.5,.5-v*.5,a,v)];}
  if(kind==='vector'){const q=ramp(p,.30,.82);return [q===0?rect(0,0,0,0):halfPlane(rect(0,0,1,1),q*2)];}
  if(kind==='relay')return Array.from({length:5},(_,i)=>{const a=ramp(p,.27+i*.048,.60+i*.048);return rect(i%2?1-a:0,i/5,a,.2);});
  if(kind==='tension'){const a=ramp(p,.29,.79);return [rect(0,.5-a*.5,1,a)];}
  const folio=clamp(folioFraction),a=ramp(p,.18,.46),b=ramp(p,.43,.84);
  return [rect(0,1-a,folio,a),rect(folio,0,(1-folio)*b,1)];
}
function buildStudy(kind,w,h,box) {
  const b={...box},scene={kind,w,h,box:b,routes:[],nodes:[],labels:[],ticks:[],compact:w<600};
  const red='#c72830',grey='#8f8474',dim='#433c34';
  const route=(points,isRed=false,delay=.03,duration=.35,alpha=.82)=>scene.routes.push({points,color:isRed?red:grey,width:isRed?1.15:.8,delay,duration,alpha,trace:isRed});
  const node=(x,y,id,isRed=false,delay=.06,dx=0,dy=0)=>scene.nodes.push({x,y,id,isRed,delay,dx,dy});
  const label=(x,y,text,align='left')=>scene.labels.push({x,y,text,align});
  const {x,y,w:bw,h:bh}=b,right=x+bw,bottom=y+bh,cx=w/2,cy=h/2;
  const small=scene.compact,leftRail=small?18:Math.max(38,x*.48),rightRail=w-leftRail;
  const top=Math.max(56,y-26),low=Math.min(h-54,bottom+26);
  if(kind==='docking') {
    const anchors=[[x-13,y-13],[right+13,y-13],[x-13,bottom+13],[right+13,bottom+13]];
    anchors.forEach(([ax,ay],i)=>{
      const left=i%2===0,upper=i<2,sx=left?-1:1,sy=upper?-1:1;
      const start=small?[w*(left?.16:.84),upper?top-10:low+10]:[left?leftRail:rightRail,cy+(upper?-1:1)*bh*.26];
      const outer=small?[w*(left?.35:.65),upper?top-13:low+13]:[left?35:w-35,upper?top:low];
      const mid=small?[w*(left?.07:.93),ay]:[ax+sx*40,ay-sy*bh*.16];
      route([outer,start,mid,[ax,ay]],i===3,.035+i*.035,.30);
      route([outer,mid],false,.08+i*.035,.30,.42);
      route([start,[ax,ay]],false,.13+i*.035,.24,.56);
      node(...outer,String(i*3+1).padStart(2,'0'),false,.04+i*.025,sx*22,sy*12);
      node(...start,String(i*3+2).padStart(2,'0'),i===3,.07+i*.03,sx*24,sy*14);
      node(...mid,String(i*3+3).padStart(2,'0'),false,.09+i*.03,sx*12,sy*8);
    });
    route([[leftRail,top],[cx-42,top],[cx-34,top-8],[cx+34,top-8],[cx+42,top],[rightRail,top]],false,.14,.32,.55);
    route([[leftRail,low],[cx-50,low],[cx-42,low+8],[cx+42,low+8],[cx+50,low],[rightRail,low]],true,.15,.33,.65);
    if(!small){label(35,cy-10,'PALM // 01');label(w-35,cy+18,'PALM // 04','right');}
  } else if(kind==='vector') {
    const paths=small?[
      [[16,top-16],[w*.40,top-16],[w*.54,top+3],[w-20,top+3]],
      [[20,low-3],[w*.50,low-3],[w*.67,low+15],[w-16,low+15]]
    ]:[
      [[-20,100],[x*.50,130],[x-34,y+bh*.28],[right+36,y+bh*.64],[w+20,h-92]],
      [[-20,170],[x*.46,205],[x-42,y+bh*.48],[right+42,y+bh*.83],[w+20,h-26]],
      [[-20,32],[x*.45,65],[x-30,y+bh*.10],[right+38,y+bh*.42],[w+20,h-174]]
    ];
    paths.forEach((points,i)=>{
      route(points,i===0,.03+i*.075,.43,.82-i*.15);
      points.slice(1,-1).forEach(([px,py],j)=>node(px,py,String(i*4+j+1).padStart(2,'0'),i===0&&j===0,.06+j*.05+i*.06,-36,-16));
      const shifted=points.map(([px,py])=>[px,py+8]);route(shifted,false,.1+i*.05,.35,.24);
    });
    if(!small){route([[x*.50,130],[x*.46,205],[x-42,y+bh*.48]],false,.11,.31,.55);route([[right+38,y+bh*.42],[right+36,y+bh*.64],[right+42,y+bh*.83]],false,.15,.32,.55);label(36,h-96,'VECTOR // 704');label(w-36,96,'TYPE-17 / LINK','right');}
  } else if(kind==='relay') {
    const start=small?top-12:y+12,end=small?low+12:bottom-12;
    route([[leftRail,start],[leftRail,end]],true,.01,.42,.55);route([[rightRail,end],[rightRail,start]],false,.05,.42,.60);
    for(let i=0;i<5;i++) {
      const yy=y+bh*(i+.5)/5,left=i%2===0,rail=left?leftRail:rightRail,edge=left?x-12:right+12;
      if(!small){const elbow=left?x-42:right+42;route([[rail,yy+(left?-15:15)],[elbow,yy+(left?-15:15)],[elbow,yy],[edge,yy]],i===4,.06+i*.04,.25,.82);node(rail,yy+(left?-15:15),String(i+1).padStart(2,'0'),i===4,.03+i*.045,left?-16:16,0);}
      else {const xx=w*(.12+i*.19);route([[xx,top-10],[xx,top+6]],i===4,.04+i*.04,.24);node(xx,top-10,String(i+1).padStart(2,'0'),i===4,.07+i*.035,0,-10);route([[xx,low-6],[xx,low+10]],false,.10+i*.04,.24);}
    }
    if(!small){route([[32,y+bh*.20],[leftRail,y+bh*.20]],false,.13,.22,.35);route([[rightRail,y+bh*.78],[w-32,y+bh*.78]],false,.14,.22,.35);label(32,top-8,'RELAY / 05');label(w-32,low+20,'INDEX // 01 / 05','right');}
  } else if(kind==='tension') {
    const anchors=small?[[w*.16,top-12],[w*.84,top-12],[w*.16,low+12],[w*.84,low+12]]:[[42,cy],[w-42,cy],[leftRail,top-8],[rightRail,low+8]];
    anchors.forEach(([px,py],i)=>node(px,py,String(i+1).padStart(2,'0'),i===1,.035+i*.035,i%2?26:-26,0));
    if(!small){route([[42,cy],[leftRail,top-8],[rightRail,top-8],[w-42,cy],[rightRail,low+8],[leftRail,low+8],[42,cy]],false,.02,.42,.61);route([[leftRail-10,top-16],[rightRail+10,top-16]],false,.12,.32,.31);route([[leftRail-10,low+16],[rightRail+10,low+16]],false,.12,.32,.31);label(36,cy-24,'TENSION / A');label(w-36,cy+34,'TENSION / B','right');}
    else{route([anchors[0],anchors[1]],false,.03,.36,.55);route([anchors[2],anchors[3]],true,.07,.36,.6);}
    scene.anchors=anchors;
  } else {
    const spineX=small?x-7:x-28,port=[spineX,bottom+12];
    const lead=small?[[w*.20,low+10],port,[spineX,y-12]]:[[32,h-80],[leftRail,low+12],port,[spineX,y-12],[leftRail,top-4],[36,70]];
    route(lead,true,.02,.40,.86);
    if(!small){node(leftRail,low+12,'01',true,.02,-35,0);node(leftRail,top-4,'02',false,.1,-24,0);label(36,cy,'BUS // 704');}
    for(let i=0;i<4;i++) {
      const yy=y+bh*(.12+i*.255),endx=small?w-18:rightRail;
      if(!small){const a=[right+15,yy],b2=[endx,yy+(i%2?26:-26)],c=[w-34,yy+(i%2?-4:4)];route([a,b2,c],i===3,.12+i*.03,.28,.70);if(i<3)route([b2,[endx,y+bh*(.12+(i+1)*.255)+((i+1)%2?26:-26)]],false,.13+i*.035,.25,.42);node(...b2,String(i+3).padStart(2,'0'),i===3,.08+i*.04,28,0);}
    }
    route([[small?w*.45:right+18,top-9],[w-30,top-9],[w-30,top+6]],false,.13,.29,.46);
    route([[w-30,low-6],[w-30,low+9],[small?w*.45:right+18,low+9]],true,.15,.29,.64);
  }
  for(let i=0;i<14;i++) {const yy=60+i*(h-120)/13;scene.ticks.push([[14,yy],[i%3===0?23:19,yy]]);scene.ticks.push([[w-14,yy],[w-(i%3===0?23:19),yy]]);}
  return scene;
}
function drawDiamond(c,x,y,red,alpha=1,size=4) {
  if(alpha<=.001)return;const points=[[x,y-size],[x+size,y],[x,y+size],[x-size,y],[x,y-size]];
  strokePath(c,points,red?'#d72b31':'#a59c8c',.9,alpha);
  if(red){c.fillStyle='#ba1e27';c.globalAlpha=alpha;c.fill();}
}
function drawStudy(c,scene,p,ink=1) {
  p=clamp(p);ink=clamp(ink);const {kind,w,h,box:b}=scene;
  c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,w,h);c.lineCap='butt';c.lineJoin='miter';if(p===0)return;
  const present=ramp(p,0,.13),{x,y,w:bw,h:bh}=b,right=x+bw,bottom=y+bh;
  for(const tick of scene.ticks)strokePath(c,tick,'#695d4d',.8,.48*present*ink);
  for(const route of scene.routes) {
    const q=ramp(p,route.delay,route.delay+route.duration);strokePath(c,route.points,route.color,route.width,route.alpha*present*ink,q);
    if(route.trace&&q>0&&q<1){const head=pointAlong(route.points,q);drawDiamond(c,...head,true,ink,3);}
  }
  for(const node of scene.nodes) {
    const q=ramp(p,node.delay,node.delay+.30),nx=node.x+node.dx*(1-q),ny=node.y+node.dy*(1-q);
    drawDiamond(c,nx,ny,node.isRed,q*ink,node.isRed?5:3.3);
    strokePath(c,[[nx-11,ny],[nx-7,ny]],'#7b6d5b',.7,q*ink);strokePath(c,[[nx+7,ny],[nx+11,ny]],'#7b6d5b',.7,q*ink);
    if(!scene.compact&&nx>26&&nx<w-32){c.font='11px "JetBrains Mono",monospace';c.textAlign=nx>w/2?'right':'left';c.textBaseline='alphabetic';c.fillStyle=node.isRed?'#cc4141':'#9b9180';c.globalAlpha=q*ink;c.fillText(node.id,nx+(nx>w/2?-12:12),ny-12);}
  }
  for(const label of scene.labels) {c.font='11px "JetBrains Mono",monospace';c.textAlign=label.align;c.fillStyle='#958574';c.globalAlpha=ramp(p,.15,.39)*ink;c.fillText(label.text,label.x,label.y);}
  const warm='#9a8c78',red='#d1252d';
  if(kind==='docking') {
    const q=ramp(p,.12,.33),a=ramp(p,.29,.78),halfw=bw*a/2,cx=x+bw/2;
    [[x,y,-1,-1],[right,y,1,-1],[x,bottom,-1,1],[right,bottom,1,1]].forEach(([ax,ay,sx,sy],i)=>{
      const xx=ax+sx*(8+28*(1-q)),yy=ay+sy*(8+15*(1-q));
      strokePath(c,[[xx,yy+sy*22],[xx,yy],[xx+sx*22,yy]],i===3?red:warm,1.1,q*ink);
      strokePath(c,[[xx+sx*5,yy+sy*4],[xx+sx*5,yy+sy*12]],red,1,q*ink);
    });
    if(a>0&&a<1){strokePath(c,[[cx-halfw,y-5],[cx-halfw,bottom+5]],red,1,ink);strokePath(c,[[cx+halfw,y-5],[cx+halfw,bottom+5]],red,1,ink);}
  } else if(kind==='vector') {
    const q=ramp(p,.30,.82),threshold=q*2,intersections=[];
    for(const pt of [[0,threshold],[1,threshold-1],[threshold,0],[threshold-1,1]])if(pt[0]>=0&&pt[0]<=1&&pt[1]>=0&&pt[1]<=1&&!intersections.some(a=>Math.hypot(a[0]-pt[0],a[1]-pt[1])<.001))intersections.push(pt);
    if(q>0&&q<1&&intersections.length===2){const line=intersections.map(([u,v])=>[x+u*bw,y+v*bh]);strokePath(c,line,red,2,ink);line.forEach(pt=>drawDiamond(c,...pt,true,ink,4));}
    const q2=ramp(p,.18,.46);strokePath(c,[[x-16,y+20],[x-16,y-12],[x+56,y-12]],warm,.8,q2*ink);strokePath(c,[[right+16,bottom-20],[right+16,bottom+12],[right-56,bottom+12]],red,1,q2*ink);
  } else if(kind==='relay') {
    for(let i=0;i<5;i++) {const a=ramp(p,.27+i*.048,.60+i*.048),yy=y+bh*(i+.5)/5,xx=i%2?right-bw*a:x+bw*a;
      strokePath(c,[[x-17,yy],[x-8,yy]],i%2?warm:red,1,ink*ramp(p,.1,.38));strokePath(c,[[right+8,yy],[right+17,yy]],i%2?red:warm,1,ink*ramp(p,.1,.38));
      if(a>0&&a<1)strokePath(c,[[xx,y+bh*i/5],[xx,y+bh*(i+1)/5]],red,1.6,ink);
    }
    strokePath(c,[[x-8,y-10],[right+8,y-10]],warm,.8,ink,ramp(p,.15,.40));strokePath(c,[[right+8,bottom+10],[x-8,bottom+10]],red,1,ink,ramp(p,.18,.42));
  } else if(kind==='tension') {
    const a=ramp(p,.29,.79),top=y+bh*(.5-a*.5),low=y+bh*(.5+a*.5),q=ramp(p,.06,.36);
    for(let i=0;i<4;i++) {
      const left=i%2===0,upper=i<2,start=scene.compact?scene.anchors[i]:[left?42:w-42,h/2],end=[left?x-10:right+10,upper?top-7:low+7];
      strokePath(c,[start,[lerp(start[0],end[0],.43),lerp(start[1],end[1],.45)+(upper?-9:9)],end],i===3?red:warm,i===3?1.25:.85,q*ink);
      drawDiamond(c,...end,i===3,q*ink,4);
    }
    strokePath(c,[[x-14,top-7],[right+14,top-7]],warm,1,q*ink);strokePath(c,[[x-14,low+7],[right+14,low+7]],red,1.2,q*ink);
  } else {
    const a=ramp(p,.18,.46),q=ramp(p,.43,.84),edge=x+b.folio+(bw-b.folio)*q;
    strokePath(c,[[x-7,bottom+10],[x-7,bottom-bh*a]],red,1.25,ink*ramp(p,.06,.18));
    if(q>0&&q<1)strokePath(c,[[edge,y-8],[edge,bottom+8]],red,1.6,ink);
    strokePath(c,[[x+b.folio,y-10],[right+10,y-10],[right+10,y+22]],warm,.8,ink,ramp(p,.28,.57));
    strokePath(c,[[right+10,bottom-22],[right+10,bottom+10],[x+b.folio,bottom+10]],red,1,ink,ramp(p,.30,.59));
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
  const panelW=panelBounds.width||Math.max(1,Math.min(w-32,408)),panelH=panelBounds.height||448;
  const box={x:panelBounds.width?panelBounds.left-bounds.left:(w-panelW)/2,y:panelBounds.height?panelBounds.top-bounds.top:(h-panelH)/2,w:panelW,h:panelH,folio:folioBounds.width||Math.min(panelW,w<540?64:106)};
  const key=[settings.design,w,h,...Object.values(box).map(v=>Math.round(v*10)/10)].join(':');
  if(sceneKey!==key){sceneKey=key;scene=buildStudy(settings.design,w,h,box);}
  const dpr=Math.min(globalThis.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx?.setTransform(dpr,0,0,dpr,0,0);
}
function maskPath(polygons) {
  return polygons.filter(poly=>poly.length).map(poly=>'M'+poly.map(([x,y])=>x.toFixed(5)+' '+y.toFixed(5)).join('L')+'Z').join('');
}
function paint() {
  measure();if(ctx)drawStudy(ctx,scene,progress,settings.ink/100);
  const d=maskPath(panelShape(settings.design,progress,scene.box.folio/scene.box.w));
  mask.setAttribute('d',d);trace.setAttribute('d',d);
  trace.style.opacity=String(ramp(progress,.16,.28)*(1-ramp(progress,.84,.93)));
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
  lockState.textContent=target?'FORMATION LINKED':'LOCK RELEASED';
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
  lockState.textContent=target?'LINK / ASSEMBLE':'RELEASE / WITHDRAW';
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
  tweak.addSlider(settings,'ink',{label:'Linework ink',min:55,max:100,step:5,unit:'%'});
  tweak.addSlider(settings,'speed',{label:'Playback speed',min:.5,max:1.5,step:.25,unit:'×'});
  tweak.addToggle(settings,'motion',{label:'Animations'});
}

})();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"spine\"]"}], "remove": ["button[data-design]"], "controls": false});
