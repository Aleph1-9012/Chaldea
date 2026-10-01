
(() => {
  const root=document.getElementById('ts-flat-wave-replacements'); if(!root)return;
  const stage=root.querySelector('.wb-stage'), canvas=root.querySelector('.wb-field'), ctx=canvas.getContext('2d');
  const panel=root.querySelector('.wb-panel'), glyphCanvas=root.querySelector('.wb-glyph'), glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#wb-flat-dummy-input'), unlock=root.querySelector('.wb-unlock'), authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'), fieldName=root.querySelector('[data-field-name]'), lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'), exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'contour',panel:true,ink:100,motion:true};
  const names={contour:'Register print',relay:'Relay etch',plates:'Stencil press',formation:'Shōi linkage',membrane:'Cellular ink'};
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let scene=null,width=0,height=0,mode='locked',sequence=null,frame=null;
  let count=0,phase=0,glyphMotion=null,glyphFrame=null,composing=false;

  // FIELD ENGINE: full-screen artwork only. No login-panel geometry is used.
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=v=>{const x=clamp(v);return x*x*(3-2*x);};
  const ease=v=>{const x=clamp(v);return 1-Math.pow(1-x,3);};
  function hash(x,y,seed=0) {
    let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^Math.imul(seed+1,1442695041);
    n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
  }
  function strokePath(c,points,color,lineWidth=1,alpha=1,fraction=1,erase=false) {
    if(points.length<2||alpha<=.001||fraction<=.001)return;
    if(fraction>=.9999) {
      c.beginPath();c.moveTo(points[0][0],points[0][1]);
      for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
      c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha=clamp(alpha);c.stroke();return;
    }
    const lengths=[0];let total=0;
    for(let i=1;i<points.length;i++){total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(total);}
    const limit=total*clamp(fraction),start=erase?total-limit:0,end=erase?total:limit;
    c.beginPath();let began=false;
    for(let i=1;i<points.length;i++){
      const a=lengths[i-1],b=lengths[i];if(b<start||a>end||b-a<.0001)continue;
      const t0=clamp((start-a)/(b-a)),t1=clamp((end-a)/(b-a));
      const x0=lerp(points[i-1][0],points[i][0],t0),y0=lerp(points[i-1][1],points[i][1],t0);
      if(!began){c.moveTo(x0,y0);began=true;}
      c.lineTo(lerp(points[i-1][0],points[i][0],t1),lerp(points[i-1][1],points[i][1],t1));
    }
    c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha=clamp(alpha);c.stroke();
  }
  function flatPolygon(c,points) { c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath(); }
  function roundedCell(c,points) {
    const mid=(a,b)=>[(a[0]+b[0])*.5,(a[1]+b[1])*.5];
    const start=mid(points[points.length-1],points[0]);c.moveTo(start[0],start[1]);
    for(let i=0;i<points.length;i++){const end=mid(points[i],points[(i+1)%points.length]);c.quadraticCurveTo(points[i][0],points[i][1],end[0],end[1]);}c.closePath();
  }
  function clipCell(points,nx,ny,limit) {
    const out=[];
    for(let i=0;i<points.length;i++) {
      const a=points[i],b=points[(i+1)%points.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;
      if(da<=0)out.push(a);
      if((da<0)!==(db<0)){const q=da/(da-db);out.push([lerp(a[0],b[0],q),lerp(a[1],b[1],q)]);}
    }
    return out;
  }
  function buildField(kind,w,h) {
    const field={kind,w,h,marks:[],routes:[],bands:[],nodes:[],links:[],lines:[],cells:[]};
    if(kind==='contour') {
      const cell=56,cols=Math.ceil(w/cell),rows=Math.ceil(h/cell);
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++) {
        const x=col*cell,y=row*cell,type=Math.floor(hash(col,row,8)*4),delay=(col/cols*.36+row/rows*.3)+hash(col,row,4)*.05;
        if(type===0||type===1) {
          for(let j=0;j<7;j++)field.marks.push({points:[[x+5,y+7+j*6],[x+43,y+7+j*6]],delay:delay+j*.009,color:type===0?'#8b252c':'#4a3f35',width:j===0?2:.8,shift:col%2?12:-12});
        } else if(type===2) {
          for(let j=0;j<4;j++)for(let k=0;k<4;k++)field.marks.push({rect:[x+8+j*11,y+8+k*11,3,3],delay:delay+(j+k)*.008,color:'#9c3034',shift:row%2?-9:9});
        } else {
          field.marks.push({rect:[x+5,y+8,41,4],delay,color:'#9c3034',shift:-16});
          for(let j=0;j<4;j++)field.marks.push({rect:[x+5+j*10,y+24,6,15+j%2*9],delay:delay+.035*j,color:'#632126',shift:16});
        }
      }
      for(let j=0;j<6;j++){const y=(j+.5)*h/6;field.marks.push({points:[[0,y],[w,y]],delay:.08+j*.10,color:'#622027',width:.7,shift:0});}
    } else if(kind==='relay') {
      const cell=32,rows=Math.ceil(h/cell)+1,cols=Math.ceil(w/cell)+1;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++) {
        const px=x*cell,py=y*cell,flip=hash(x,y,7)>.5,vertical=hash(x,y,4)>.5;
        const shape=flip?[[0,.5],[.32,.5],[.32,.22],[.7,.22],[.7,.5],[1,.5]]:[[0,.5],[.22,.5],[.22,.76],[.7,.76],[.7,.5],[1,.5]];
        const points=shape.map(([a,b])=>vertical?[px+b*cell,py+a*cell]:[px+a*cell,py+b*cell]);
        const delay=clamp(px/w*.43+py/h*.24+hash(x,y,11)*.07,0,.70),red=hash(x,y,2)>.62;
        field.routes.push({points,delay,color:red?'#b62b31':'#514c42',width:red?1.3:.85,seed:hash(x,y,29)});
        if(hash(x,y,12)>.65)field.routes.push({points:[[px+cell*.42,py+cell*.04],[px+cell*.42,py+cell*.36],[px+cell*.81,py+cell*.36]],delay:delay+.04,color:'#7c272e',width:.7,seed:.3});
      }
    } else if(kind==='plates') {
      field.bands=[
        {x:0,y:h*.12,width:w*.86,height:h*.18,delay:0,sign:-1,fill:'#8f1d26',text:'SID0NIA',font:Math.min(w*.093,h*.146),ink:'#0a0909',align:'left'},
        {x:w*.14,y:h*.405,width:w*.86,height:h*.105,delay:.14,sign:1,fill:'#1d1917',text:'TYPE-17   //   704',font:Math.min(w*.041,h*.065),ink:'#a99b87',align:'right'},
        {x:0,y:h*.735,width:w*.93,height:h*.16,delay:.28,sign:-1,fill:'#631920',text:'東亜重工',font:Math.min(w*.105,h*.13),ink:'#0a0909',align:'right'}
      ];
      for(let row=0;row<3;row++) {
        const y=h*(.33+row*.19);
        field.lines.push({points:[[0,y],[w,y]],color:'#6b262b',width:.8,delay:.1+row*.13});
        for(let col=0;col<20;col++)field.lines.push({points:[[col*w/20,y-3],[col*w/20,y+3]],color:'#88765f',width:.8,delay:.1+row*.13+col*.008});
      }
    } else if(kind==='formation') {
      const positions=[[.075,.18],[.225,.145],[.292,.315],[.125,.36],[.745,.135],[.925,.20],[.84,.38],[.703,.295],[.08,.68],[.235,.615],[.285,.84],[.135,.875],[.745,.63],[.935,.705],[.835,.90],[.675,.855]];
      positions.forEach(([x,y],i)=>field.nodes.push({x:x*w,y:y*h,dx:(x<.5?-1:1)*(34+hash(i,1,4)*50),dy:(y<.5?-1:1)*(20+hash(i,2,4)*30),delay:Math.floor(i/4)*.09+(i%4)*.025,red:i%4===0,id:String(i+1).padStart(2,'0')}));
      const pairs=[[0,1],[1,2],[2,3],[3,0],[0,2],[4,5],[5,6],[6,7],[7,4],[4,6],[8,9],[9,10],[10,11],[11,8],[8,10],[12,13],[13,14],[14,15],[15,12],[12,14],[1,4],[2,7],[3,8],[6,13],[9,12],[10,15]];
      pairs.forEach(([a,b],i)=>field.links.push({a,b,delay:.12+Math.max(field.nodes[a].delay,field.nodes[b].delay),red:i%5===0}));
      for(let row=0;row<7;row++) {
        const y=80+row*(h-152)/6;
        field.lines.push({points:[[0,y],[36,y],[45,y-9],[70,y-9]],color:'#5a4e40',width:.7,delay:row*.045});
        field.lines.push({points:[[w,y],[w-36,y],[w-45,y+9],[w-70,y+9]],color:'#5a4e40',width:.7,delay:row*.045});
      }
    } else if(kind==='membrane') {
      const size=76,sites=[],cols=Math.ceil(w/size)+1,rows=Math.ceil(h/size)+1;
      for(let y=-1;y<=rows;y++)for(let x=-1;x<=cols;x++)sites.push({x:x*size+(hash(x+2,y+2,9)-.5)*size*.7,y:y*size+(hash(x+2,y+2,4)-.5)*size*.7,key:sites.length});
      for(const site of sites) {
        let points=[[0,0],[w,0],[w,h],[0,h]];
        for(const other of sites) {
          if(other===site||Math.abs(other.x-site.x)>size*2.6||Math.abs(other.y-site.y)>size*2.6)continue;
          const nx=other.x-site.x,ny=other.y-site.y,limit=(other.x*other.x+other.y*other.y-site.x*site.x-site.y*site.y)*.5;
          points=clipCell(points,nx,ny,limit);if(points.length<3)break;
        }
        if(points.length<3)continue;
        const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
        const outer=points.map(([x,y])=>[lerp(cx,x,.94),lerp(cy,y,.94)]);
        const pores=.38+hash(site.key,2,18)*.46;
        const inner=points.map(([x,y],i)=>[lerp(cx,x,pores*(.9+hash(site.key,i,3)*.17)),lerp(cy,y,pores*(.9+hash(site.key,i,3)*.17))]);
        const delay=Math.min(cx/w,1-cx/w)*.95+cy/h*.09+hash(site.key,2,6)*.09;
        field.cells.push({outer,inner,cx,cy,delay,color:site.key%8===0?'#8b2930':'#43171c'});
      }
    }
    return field;
  }
  function drawField(c,field,t,direction,ink=1) {
    ink=clamp(ink);const {w,h,kind}=field,tick=clamp(t),enter=direction==='enter';
    c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,w,h);c.lineCap='butt';c.lineJoin='miter';
    if((enter&&tick===0)||(!enter&&tick===1))return;
    if(kind==='contour') {
      for(const mark of field.marks) {
        const delay=enter?mark.delay:.78-mark.delay,local=smooth((tick-delay)/.19),amount=enter?local:1-local;
        if(amount<.001)continue;
        const dx=mark.shift*(1-amount);
        c.save();c.translate(dx,0);
        if(mark.rect){c.fillStyle=mark.color;c.globalAlpha=amount*ink;const [x,y,a,b]=mark.rect;c.fillRect(x,y,a,b);}
        else strokePath(c,mark.points,mark.color,mark.width,amount*ink);
        c.restore();
      }
    } else if(kind==='relay') {
      for(const route of field.routes) {
        const delay=enter?route.delay:.74-route.delay,local=smooth((tick-delay)/.24),visible=enter?local:1-local;
        if(visible<.001)continue;
        const active=local>0&&local<1;
        strokePath(c,route.points,active?'#d44544':route.color,route.width,(active?.93:.82)*ink,visible,!enter);
        if(active&&route.seed>.74){const head=route.points[enter?0:route.points.length-1];c.fillStyle='#c3b7a2';c.globalAlpha=Math.sin(Math.PI*local)*.8*ink;c.fillRect(head[0]-1,head[1]-1,2,2);}
      }
    } else if(kind==='plates') {
      for(const band of field.bands) {
        const local=ease((tick-band.delay)/.5),amount=enter?local:1-local;if(amount<.001)continue;
        const dx=band.sign*(1-amount)*(w+10);
        c.save();c.translate(dx,0);c.globalAlpha=ink;c.fillStyle=band.fill;c.fillRect(band.x,band.y,band.width,band.height);
        c.beginPath();c.rect(band.x,band.y,band.width,band.height);c.clip();
        c.fillStyle=band.ink;c.font='500 '+Math.max(28,band.font)+'px "Noto Sans JP", "JetBrains Mono", sans-serif';
        c.textBaseline='middle';c.textAlign=band.align;
        c.fillText(band.text,band.align==='left'?band.x+24:band.x+band.width-24,band.y+band.height*.49);
        c.fillStyle='#080808';
        for(let i=0;i<5;i++)c.fillRect(band.x+(i+.5)*band.width/5,band.y,2,band.height);
        c.restore();
      }
      for(const line of field.lines){const local=smooth((tick-line.delay)/.36);strokePath(c,line.points,line.color,line.width,ink,enter?local:1-local,!enter);}
    } else if(kind==='formation') {
      const live=field.nodes.map(node=>{const a=ease((tick-node.delay)/.4),p=enter?a:1-a;return {...node,x:node.x+node.dx*(1-p),y:node.y+node.dy*(1-p),p};});
      for(const line of field.lines){const p=smooth((tick-line.delay)/.48);strokePath(c,line.points,line.color,line.width,.75*ink,enter?p:1-p,!enter);}
      for(const link of field.links){const a=live[link.a],b=live[link.b],p=smooth((tick-link.delay)/.36),amount=enter?p:1-p;strokePath(c,[[a.x,a.y],[b.x,b.y]],link.red?'#bc3a3c':'#92836e',link.red?1.2:.85,.85*ink,amount,!enter);}
      for(const node of live) {
        if(node.p<.001)continue;
        const {x,y,p}=node,size=node.red?6:4,diamond=[[x,y-size],[x+size,y],[x,y+size],[x-size,y],[x,y-size]];
        strokePath(c,diamond,node.red?'#d3262d':'#b0a590',.9,p*ink);
        if(node.red){c.beginPath();flatPolygon(c,diamond);c.fillStyle='#a92228';c.globalAlpha=p*ink;c.fill();}
        for(const points of [[[x-13,y],[x-8,y]],[[x+8,y],[x+13,y]],[[x,y-13],[x,y-8]],[[x,y+8],[x,y+13]]])strokePath(c,points,'#6c5e52',.8,p*ink);
        c.font='11px "JetBrains Mono",monospace';c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=node.red?'#c94a47':'#9d9180';c.globalAlpha=p*ink;c.fillText(node.id,x+12,y-12);
      }
    } else if(kind==='membrane') {
      for(const cell of field.cells) {
        const local=smooth((tick-cell.delay)/.33),amount=enter?local:1-local;if(amount<.001)continue;
        const outer=enter?cell.outer.map(([x,y])=>[lerp(cell.cx,x,amount),lerp(cell.cy,y,amount)]):cell.outer;
        const opening=enter?smooth((amount-.30)/.70):1+(1-amount)*2.3;
        const inner=cell.inner.map(([x,y])=>[lerp(cell.cx,x,opening),lerp(cell.cy,y,opening)]);
        c.save();c.beginPath();roundedCell(c,outer);c.clip();
        c.fillStyle=cell.color;c.globalAlpha=ink;c.fillRect(0,0,w,h);
        c.beginPath();roundedCell(c,inner);c.fillStyle='#080808';c.globalAlpha=1;c.fill();
        c.restore();
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
  // Playback control. Both new background sequences stop at a stable frame.
  function measure() {
    const bounds=stage.getBoundingClientRect(),w=Math.max(1,Math.round(bounds.width)),h=Math.max(1,Math.round(bounds.height));
    const dpr=Math.min(globalThis.devicePixelRatio||1,2);
    if(width!==w||height!==h||scene?.kind!==settings.design){width=w;height=h;scene=buildField(settings.design,w,h);}
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  function paint(progress,direction) {
    if(ctx){measure();drawField(ctx,scene,progress,direction,settings.ink/100);}
    // Panel overlay has no translation, scaling, clipping or reveal redesign.
    const panelVisible=direction==='enter'?smooth((progress-.04)/.16):1-smooth(progress/.35);
    panel.style.opacity=String(panelVisible);
    panel.hidden=!settings.panel;
    panel.inert=panelVisible<.999||!settings.panel;
    input.disabled=panel.inert;unlock.disabled=panel.inert;
  }
  function finish(direction,moveFocus=false) {
    if(frame!==null)cancelAnimationFrame(frame);frame=null;sequence=null;
    mode=direction==='enter'?'locked':'unlocked';paint(1,direction);
    status.textContent=names[settings.design]+(mode==='locked'?' · locked frame':' · cleared to black');
    lockState.textContent=mode==='locked'?'LOCKED FRAME':'UNLOCK END';
    if(moveFocus){if(mode==='locked'&&settings.panel)input.focus();else enterButton.focus();}
  }
  function step(now) {
    frame=null;if(!root.isConnected){sequence=null;return;}if(!sequence)return;
    const progress=clamp((now-sequence.started)/sequence.duration);paint(progress,sequence.direction);
    if(progress===1)finish(sequence.direction,true);else frame=requestAnimationFrame(step);
  }
  function play(direction) {
    if(frame!==null)cancelAnimationFrame(frame);frame=null;sequence=null;
    if(!ctx||!settings.motion||preference?.matches){finish(direction,true);return;}
    sequence={direction,started:performance.now(),duration:direction==='enter'?2500:1250};
    status.textContent=names[settings.design]+(direction==='enter'?' · lock sequence':' · unlock sequence');
    lockState.textContent=direction==='enter'?'REVEAL':'CLEAR';
    paint(0,direction);frame=requestAnimationFrame(step);
  }
  function redraw() {
    fieldName.textContent=names[settings.design].toUpperCase();
    canvas.setAttribute('aria-label',names[settings.design]+', a full-screen background independent of the center panel.');
    if(sequence&&(!settings.motion||preference?.matches))finish(sequence.direction);
    else if(sequence)paint(clamp((performance.now()-sequence.started)/sequence.duration),sequence.direction);
    else finish(mode==='locked'?'enter':'exit');
    animateGlyph();
  }
  let previousDesign=settings.design;
  function designChanged() {
    if(previousDesign!==settings.design){previousDesign=settings.design;finish('enter');}
    redraw();
  }
  root.querySelectorAll('[data-design]').forEach(button=>button.addEventListener('click',()=>{
    settings.design=button.dataset.design;
    root.querySelectorAll('[data-design]').forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.classList.toggle('active',selected);});
    stage.setAttribute('aria-labelledby',button.id);
    designChanged();
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
    if(event.key==='Enter'){event.preventDefault();play('exit');}
    if(event.key==='Escape'){event.preventDefault();input.value='';consumeInput();}
  });
  unlock.addEventListener('click',()=>play('exit'));
  enterButton.addEventListener('click',()=>play('enter'));exitButton.addEventListener('click',()=>play('exit'));
  preference?.addEventListener?.('change',redraw);
  redraw();
  if(typeof ResizeObserver==='function') {
    const observer=new ResizeObserver(()=>{if(!root.isConnected){observer.disconnect();return;}redraw();});
    observer.observe(stage);observer.observe(glyphCanvas);
  }
  document.fonts?.ready.then(()=>{if(root.isConnected)redraw();});
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:stage,onChange:designChanged});
    tweak.addToggle(settings,'panel',{label:'Show centered panel'});
    tweak.addSlider(settings,'ink',{label:'Background ink',min:45,max:100,step:5,unit:'%'});
    tweak.addToggle(settings,'motion',{label:'Animations'});
  }
})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-design=\"relay\"]"}], "remove": ["button[data-design]"], "controls": false});
