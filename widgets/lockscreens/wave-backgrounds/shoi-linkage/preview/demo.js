
(() => {
  const root=document.getElementById('ts-wave-replacements'); if(!root)return;
  const stage=root.querySelector('.wb-stage'), canvas=root.querySelector('.wb-field'), ctx=canvas.getContext('2d');
  const panel=root.querySelector('.wb-panel'), glyphCanvas=root.querySelector('.wb-glyph'), glyphCtx=glyphCanvas.getContext('2d');
  const input=root.querySelector('#wb-dummy-input'), unlock=root.querySelector('.wb-unlock'), authStatus=root.querySelector('.wb-auth-status');
  const status=root.querySelector('[data-sequence-status]'), fieldName=root.querySelector('[data-field-name]'), lockState=root.querySelector('[data-lock-state]');
  const enterButton=root.querySelector('[data-action="enter"]'), exitButton=root.querySelector('[data-action="exit"]');
  const settings={design:'contour',panel:true,ink:100,motion:true};
  const names={contour:'Contour front',relay:'Relay lattice',plates:'Interlock plates',formation:'Shōi linkage',membrane:'Ena weave'};
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
  function buildField(kind,w,h) {
    const field={kind,w,h,lines:[],routes:[],plates:[],nodes:[],links:[],strands:[],pores:[]};
    if(kind==='contour') {
      const spacing=4.8,cols=Math.ceil(w/7);
      for(let i=-30;i<=h/spacing+30;i++) {
        const v=i*spacing/h,points=[];
        for(let j=0;j<=cols;j++) {
          const u=j/cols,x=u*w;
          const bend=.105*Math.sin(u*8.8+v*3.4)+.057*Math.sin(u*14.1-v*4.5)+.025*Math.sin(u*4.2+v*12.5);
          points.push([x,(v+bend)*h]);
        }
        field.lines.push({points,color:i%9===0?'#c34440':i%3===0?'#8d272e':'#582023',width:i%9===0?1.1:.75});
      }
      for(let band=0;band<4;band++) {
        const pts=[];
        for(let j=0;j<=cols;j++){const u=j/cols;pts.push([u*w,(.18+band*.215+.032*Math.sin(u*8+band))*h]);}
        field.lines.push({points:pts,color:'#cc5650',width:.7});
      }
    } else if(kind==='relay') {
      const cell=32,rows=Math.ceil(h/cell)+1,cols=Math.ceil(w/cell)+1;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++) {
        const px=x*cell,py=y*cell,flip=hash(x,y,7)>.5,vertical=hash(x,y,4)>.5;
        const shape=flip?[[0,.5],[.32,.5],[.32,.22],[.7,.22],[.7,.5],[1,.5]]:[[0,.5],[.22,.5],[.22,.76],[.7,.76],[.7,.5],[1,.5]];
        const points=shape.map(([a,b])=>vertical?[px+b*cell,py+a*cell]:[px+a*cell,py+b*cell]);
        const delay=clamp(px/w*.43+py/h*.24+hash(x,y,11)*.07,0,.70);
        const red=hash(x,y,2)>.62;
        field.routes.push({points,delay,color:red?'#a92b2e':'#3e3b35',width:red?1.3:.85,seed:hash(x,y,29)});
        if(hash(x,y,12)>.65)field.routes.push({points:[[px+cell*.42,py+cell*.04],[px+cell*.42,py+cell*.36],[px+cell*.81,py+cell*.36]],delay:delay+.04,color:'#6a2528',width:.7,seed:.3});
      }
    } else if(kind==='plates') {
      const total=Math.max(7,Math.ceil(w/74)),step=w/total;
      for(let i=0;i<total;i++) {
        const x=i*step+1,odd=i%2===1;
        const points=[[x,0],[x+step-4,0],[x+step-4,h*.27],[x+step-13,h*.27+12],[x+step-13,h*.64],[x+step-4,h*.64+12],[x+step-4,h],[x,h],[x,h*.49],[x+8,h*.49-12],[x+8,h*.19],[x,h*.19-12]];
        field.plates.push({points,x,width:step-4,odd,delay:Math.abs(i-(total-1)*.5)/total*.5+hash(i,0,5)*.08,color:i%3===0?'#411215':i%3===1?'#230d0e':'#2c1213'});
      }
    } else if(kind==='formation') {
      const positions=[[.075,.18],[.225,.145],[.292,.315],[.125,.36],[.745,.135],[.925,.20],[.84,.38],[.703,.295],[.08,.68],[.235,.615],[.285,.84],[.135,.875],[.745,.63],[.935,.705],[.835,.90],[.675,.855]];
      positions.forEach(([x,y],i)=>field.nodes.push({x:x*w,y:y*h,dx:(x<.5?-1:1)*(34+hash(i,1,4)*50),dy:(y<.5?-1:1)*(20+hash(i,2,4)*30),delay:Math.floor(i/4)*.09+(i%4)*.025,red:i%4===0,id:String(i+1).padStart(2,'0')}));
      const pairs=[[0,1],[1,2],[2,3],[3,0],[0,2],[4,5],[5,6],[6,7],[7,4],[4,6],[8,9],[9,10],[10,11],[11,8],[8,10],[12,13],[13,14],[14,15],[15,12],[12,14],[1,4],[2,7],[3,8],[6,13],[9,12],[10,15]];
      pairs.forEach(([a,b],i)=>field.links.push({a,b,delay:.12+Math.max(field.nodes[a].delay,field.nodes[b].delay),red:i%5===0}));
      for(let row=0;row<7;row++) {
        const y=80+row*(h-152)/6;
        field.lines.push({points:[[0,y],[36,y],[45,y-9],[70,y-9]],color:'#453c35',width:.7,delay:row*.045});
        field.lines.push({points:[[w,y],[w-36,y],[w-45,y+9],[w-70,y+9]],color:'#453c35',width:.7,delay:row*.045});
      }
    } else if(kind==='membrane') {
      const curves=[
        [[-.10,1.04],[.31,.80],[-.15,.18],[.30,-.12]],
        [[1.10,-.04],[.69,.17],[1.15,.85],[.70,1.12]],
        [[-.10,.18],[.36,-.02],[.67,.93],[1.10,.78]],
        [[.14,-.12],[.04,.55],[.72,.93],[1.07,1.05]]
      ];
      const widths=[.13,.145,.086,.062];
      const point=(curve,t)=>{const a=1-t;return [w*(a*a*a*curve[0][0]+3*a*a*t*curve[1][0]+3*a*t*t*curve[2][0]+t*t*t*curve[3][0]),h*(a*a*a*curve[0][1]+3*a*a*t*curve[1][1]+3*a*t*t*curve[2][1]+t*t*t*curve[3][1])];};
      curves.forEach((curve,k)=>{
        for(let lane=-32;lane<=32;lane++) {
          const u=lane/32,points=[],spine=[];
          for(let j=0;j<=84;j++) {
            const t=j/84,p=point(curve,t),before=point(curve,Math.max(0,t-.002)),after=point(curve,Math.min(1,t+.002));
            const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
            const envelope=.22+.78*Math.pow(Math.sin(Math.PI*t),.7);
            const pleat=u+.16*Math.sin(u*8+t*22+k)*Math.sin(Math.PI*u)+.025*Math.sin(t*67+u*9);
            const offset=pleat*Math.min(w,h)*widths[k]*envelope;
            points.push([p[0]-dy/length*offset,p[1]+dx/length*offset]);spine.push(p);
          }
          field.strands.push({points,spine,delay:k*.10+Math.abs(u)*.11,color:lane%16===0?'#a89982':lane%7===0?'#b53539':k%2===0?'#7b3536':'#685d4e',width:lane%16===0?1:.65,reverse:k%2===1});
        }
        for(let rib=4;rib<80;rib+=3) {
          const t=rib/84,p=point(curve,t),before=point(curve,t-.003),after=point(curve,t+.003),dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1;
          const extent=Math.min(w,h)*widths[k]*(.22+.78*Math.pow(Math.sin(Math.PI*t),.7)),points=[],spine=[];
          for(let j=0;j<=12;j++){const u=j/6-1,offset=extent*u;points.push([p[0]-dy/length*offset+dx/length*Math.sin(u*Math.PI)*4,p[1]+dx/length*offset+dy/length*Math.sin(u*Math.PI)*4]);spine.push(p);}
          field.strands.push({points,spine,delay:.10+k*.09+t*.12,color:'#774139',width:.55,reverse:false});
        }
        for(let hole=0;hole<14;hole++) {
          const t=.045+hole/14*.91,p=point(curve,t),before=point(curve,t-.002),after=point(curve,t+.002),angle=Math.atan2(after[1]-before[1],after[0]-before[0]);
          const extent=Math.min(w,h)*widths[k]*(.22+.78*Math.pow(Math.sin(Math.PI*t),.7));
          const drift=(hash(hole,k,7)-.5)*extent*.7,cx=p[0]-Math.sin(angle)*drift,cy=p[1]+Math.cos(angle)*drift;
          const rx=(.20+hash(hole,k,6)*.29)*extent,ry=(.12+hash(hole,k,9)*.17)*extent,points=[];
          for(let j=0;j<=48;j++) {
            const a=j/48*Math.PI*2,rough=1+.085*Math.sin(a*5+hole)+.025*Math.sin(a*13+k);
            const x=Math.cos(a)*rx*rough,y=Math.sin(a)*ry*rough;
            points.push([cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)]);
          }
          field.pores.push({points,cx,cy,delay:.15+k*.10+t*.12,color:hole%4===0?'#ad5147':'#766255'});
        }
      });
    }
    return field;
  }
  function wavePolygon(w,h,t) {
    const radius=Math.hypot(w,h)*.53*ease(clamp(t/.83)),ripple=(1-smooth((t-.65)/.25))*smooth(t/.03)*7;
    const points=[];
    for(let i=0;i<=180;i++) {
      const angle=i/180*Math.PI*2,r=radius+ripple*(Math.sin(angle*9-t*12)+.35*Math.sin(angle*19+t*4));
      points.push([w*.5+Math.cos(angle)*Math.max(0,r),h*.5+Math.sin(angle)*Math.max(0,r)]);
    }
    return points;
  }
  function polygon(c,points) { c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath(); }
  function drawField(c,field,t,direction,ink=1) {
    ink=clamp(ink);
    const {w,h,kind}=field,tick=clamp(t),enter=direction==='enter';
    c.globalAlpha=1;c.fillStyle='#080808';c.fillRect(0,0,w,h);c.lineCap='butt';c.lineJoin='miter';
    if((enter&&tick===0)||(!enter&&tick===1))return;
    if(kind==='contour') {
      const points=wavePolygon(w,h,tick);
      c.save();
      if(tick<1){c.beginPath();if(!enter)c.rect(0,0,w,h);polygon(c,points);c.clip(enter?'nonzero':'evenodd');}
      for(const line of field.lines)strokePath(c,line.points,line.color,line.width,.86*ink);
      c.restore();
      const frontAlpha=Math.sin(Math.PI*clamp(tick/.86))*.75;
      if(tick>.006&&tick<.86) {
        strokePath(c,points,'#b63336',1.4,frontAlpha*ink);
        for(let ring=1;ring<=3;ring++) {
          const pts=wavePolygon(w,h,Math.max(0,tick-ring*.009));
          strokePath(c,pts,ring===1?'#e07060':'#562225',ring===1?.8:1,frontAlpha*(1-ring*.18)*ink);
        }
      }
    } else if(kind==='relay') {
      for(const route of field.routes) {
        const delay=enter?route.delay:.74-route.delay;
        const local=smooth((tick-delay)/.24),visible=enter?local:1-local;
        if(visible<.001)continue;
        const active=local>0&&local<1;
        strokePath(c,route.points,active?'#c54241':route.color,route.width,(active?.93:.82)*ink,visible,!enter);
        if(active&&route.seed>.74) {
          const head=route.points[enter?0:route.points.length-1];
          c.fillStyle='#c3b7a2';c.globalAlpha=Math.sin(Math.PI*local)*.8*ink;c.fillRect(head[0]-1,head[1]-1,2,2);
        }
      }
    } else if(kind==='plates') {
      for(const plate of field.plates) {
        const local=ease((tick-plate.delay)/.57),coverage=enter?local:1-local;
        if(coverage<.001)continue;
        const dy=(plate.odd?-1:1)*(1-coverage)*(h+24);
        c.save();c.translate(0,dy);c.beginPath();polygon(c,plate.points);c.clip();
        c.fillStyle=plate.color;c.globalAlpha=ink;c.fillRect(plate.x,0,plate.width,h);
        for(let y=-plate.width;y<h+plate.width;y+=6)strokePath(c,[[plate.x,y],[plate.x+plate.width,y+plate.width*.55]],plate.odd?'#601d21':'#72252a',.7,.66*ink);
        for(let y=38;y<h;y+=89) {
          c.fillStyle='#0d0909';c.globalAlpha=1;c.fillRect(plate.x+11,y,plate.width-21,9);
          strokePath(c,[[plate.x+11,y+14],[plate.x+plate.width-10,y+14]],'#a02b31',.8,.58*ink);
          c.fillStyle='#a94540';c.globalAlpha=.8*ink;c.fillRect(plate.x+11,y+3,3,3);
        }
        c.restore();
        const outline=plate.points.map(([x,y])=>[x,y+dy]);
        strokePath(c,outline,'#9c3335',.8,.65*ink);
      }
    } else if(kind==='formation') {
      const live=field.nodes.map(node=>{
        const a=ease((tick-node.delay)/.4),p=enter?a:1-a;
        return {...node,x:node.x+node.dx*(1-p),y:node.y+node.dy*(1-p),p};
      });
      for(const line of field.lines){const p=smooth((tick-line.delay)/.48);strokePath(c,line.points,line.color,line.width,.75*ink,enter?p:1-p,!enter);}
      for(const link of field.links) {
        const a=live[link.a],b=live[link.b],p=smooth((tick-link.delay)/.36),amount=enter?p:1-p;
        strokePath(c,[[a.x,a.y],[(a.x+b.x)*.5,a.y+(b.y-a.y)*.5],[b.x,b.y]],link.red?'#bc3a3c':'#92836e',link.red?1.2:.85,.85*ink,amount,!enter);
      }
      for(const node of live) {
        if(node.p<.001)continue;
        const {x,y,p}=node,size=node.red?6:4;
        const diamond=[[x,y-size],[x+size,y],[x,y+size],[x-size,y],[x,y-size]];
        strokePath(c,diamond,node.red?'#d3262d':'#b0a590',.9,p*ink);
        if(node.red){c.beginPath();polygon(c,diamond);c.fillStyle='#a92228';c.globalAlpha=p*ink;c.fill();}
        strokePath(c,[[x-13,y],[x-8,y]],'#6c5e52',.8,p*ink);
        strokePath(c,[[x+8,y],[x+13,y]],'#6c5e52',.8,p*ink);
        strokePath(c,[[x,y-13],[x,y-8]],'#6c5e52',.8,p*ink);
        strokePath(c,[[x,y+8],[x,y+13]],'#6c5e52',.8,p*ink);
        c.font='11px "JetBrains Mono",monospace';c.fillStyle=node.red?'#c94a47':'#9d9180';c.globalAlpha=p*ink;
        c.fillText(node.id,x+12,y-12);
      }
    } else if(kind==='membrane') {
      for(const strand of field.strands) {
        const local=smooth((tick-strand.delay)/.43),amount=enter?local:1-local;
        if(amount<.001)continue;
        const spread=.06+.94*smooth(amount),pts=amount>.999?strand.points:strand.points.map(([x,y],i)=>[lerp(strand.spine[i][0],x,spread),lerp(strand.spine[i][1],y,spread)]);
        const ordered=strand.reverse?[...pts].reverse():pts;
        strokePath(c,ordered,strand.color,strand.width,.82*ink,amount,!enter);
      }
      for(const pore of field.pores) {
        const local=smooth((tick-pore.delay)/.42),amount=enter?local:1-local;
        if(amount<.01)continue;
        const points=pore.points.map(([x,y])=>[lerp(pore.cx,x,amount),lerp(pore.cy,y,amount)]);
        c.beginPath();polygon(c,points);c.globalAlpha=amount;c.fillStyle='#080808';c.fill();
        strokePath(c,points,pore.color,.65,.65*amount*ink);
      }
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
  document.fonts?.ready.then(()=>{if(root.isConnected)drawGlyph();});
  if(globalThis.Tweak) {
    const tweak=new Tweak({container:stage,onChange:designChanged});
    tweak.addToggle(settings,'panel',{label:'Show centered panel'});
    tweak.addSlider(settings,'ink',{label:'Background ink',min:45,max:100,step:5,unit:'%'});
    tweak.addToggle(settings,'motion',{label:'Animations'});
  }
})();


window.ChaldeaArchive.finish({"select": [{"selector": "button[data-design=\"formation\"]"}], "remove": ["button[data-design]"], "controls": false});
