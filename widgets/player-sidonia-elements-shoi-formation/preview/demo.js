
(() => {
  const root=document.getElementById('tsugumori-sidonia-elements');if(!root)return;
  const canvas=root.querySelector('[data-matrix]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const tracks=[
    {title:'SIDONIA',artist:'angela',album:'KNIGHTS OF SIDONIA',length:263,cover:true},
    {title:'OUTER HULL',artist:'Tsugumori archive',album:'ORBITAL STUDIES / 02',length:218,cover:true},
    {title:'GARDES AT DAWN',artist:'Tsugumori archive',album:'ORBITAL STUDIES / 03',length:307,cover:false},
    {title:'THE LONG WAY HOME // ORBITAL ARCHIVE',artist:'Tsugumori archive',album:'HOMEBOUND / 04',length:346,cover:true}
  ];
  const state={track:0,position:84,playing:false};
  const design={missingArtwork:false,revealRadius:11.4,detail:'1',markingContrast:82};
  const detailNames=['Shōi formation','704 armour stripe','Toa engraving','Sidonia ship profile','Kabizashi divider','Gauna specimen'];
  const detailCanvas=root.querySelector('[data-detail-canvas]'),detailSlot=root.querySelector('[data-detail-slot]');
  let detailKey='',formationRaf=0,formationStarted=0;
  const pad=n=>String(n).padStart(2,'0');
  const time=value=>{const v=Math.max(0,Math.floor(value));return pad(Math.floor(v/60))+':'+pad(v%60);};
  const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
  const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p);};
  const makeCanvas=()=>{const c=document.createElement('canvas');c.width=640;c.height=640;return c;};
  const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
  const random=seed=>{let s=seed||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
  const say=text=>{root.querySelector('[data-announcement]').textContent=text;};
  let inView=true,clock=null,lastTick=0;
function polygon(ctx,points,fill,stroke) {
    ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();}
  }
  function drawSampleCover(c,index) {
    const s=640;
    if(drawExtraGlyphCover(c,index,s))return;
    c.clearRect(0,0,s,s); c.fillStyle='#111313';c.fillRect(0,0,s,s);
    const bg=c.createRadialGradient(332,250,8,335,290,450); bg.addColorStop(0,'#89968f');bg.addColorStop(.3,'#3b4641');bg.addColorStop(1,'#090b0b');c.fillStyle=bg;c.fillRect(0,0,s,s);
    let seed=17047+index*1943;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    c.save();c.translate(322,318);c.rotate((index-1)*.075);c.translate(-322,-318);
    // A printed architectural study. Each plate converges on the open shaft.
    for(let side=0;side<2;side++){
      for(let k=0;k<18;k++){
        const t=k/18, n=(k+1)/18, depth=Math.pow(t,1.7), next=Math.pow(n,1.7);
        const x=side?640-depth*266:depth*292, nx=side?640-next*266:next*292;
        const top=side?15+depth*172:-45+depth*242, nt=side?15+next*172:-45+next*242;
        const bot=640-depth*292, nb=640-next*292;
        const shade=Math.round(42+rand()*50+(1-depth)*18);
        polygon(c,[[x,top],[nx,nt],[nx,nb],[x,bot]],'rgb('+shade+','+(shade+5)+','+(shade+1)+')','#171d19');
        const inset=side?-12:12;
        polygon(c,[[x,top],[x+inset,top+7],[x+inset,bot-12],[x,bot]],'#111715','#58645a');
        for(let j=1;j<8;j++){const q=j/8;c.strokeStyle='rgba(201,208,189,.23)';c.beginPath();c.moveTo(x,top+(bot-top)*q);c.lineTo(nx,nt+(nb-nt)*q);c.stroke();}
      }
    }
    polygon(c,[[0,640],[292,348],[374,348],[640,640]],'#272d27');
    for(let j=0;j<14;j++) {const y=350+Math.pow(j/13,2)*290; c.strokeStyle='#596050';c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}
    for(let j=0;j<9;j++){c.strokeStyle='#10150f';c.beginPath();c.moveTo(332,345);c.lineTo(-80+j*105,640);c.stroke();}
    c.fillStyle='#0a100d';c.fillRect(292,145,84,201);
    c.fillStyle='#adb7a1';c.fillRect(302,155,4,155);c.fillStyle='#64705d';c.fillRect(362,155,3,155);
    for(let j=0;j<10;j++){const y=156+j*15;c.fillStyle=j%2?'#233029':'#3b493c';c.fillRect(310,y,44,2);}
    // Red suspended equipment is the single color accent in the sample sleeve.
    polygon(c,[[311,198],[344,187],[364,225],[349,279],[324,289],[303,254]],'#a42520','#cf6b50');
    polygon(c,[[311,198],[328,224],[324,289],[303,254]],'#521b18');
    polygon(c,[[328,224],[364,225],[349,279],[324,289]],'#7f2520');
    c.strokeStyle='#d2c9b1';c.lineWidth=1;c.beginPath();c.moveTo(333,0);c.lineTo(333,192);c.stroke();
    c.restore();
    c.fillStyle='rgba(5,6,5,.50)';c.fillRect(0,0,640,61);
    c.fillStyle='#dedace';c.font='16px monospace';c.fillText('TSUGUMORI / AUDIO ARCHIVE',24,37);
    c.font='12px monospace';c.fillStyle='#d0c4b0';c.fillText('STUDY '+pad(index+1)+'   //   SAMPLE ART',24,607);
    for(let n=0;n<9500;n++){const x=rand()*640,y=rand()*640;c.fillStyle=rand()>.5?'rgba(240,233,211,.10)':'rgba(0,0,0,.14)';c.fillRect(x,y,1,1);}
  }

function drawExtraGlyphCover(ctx, index, size) {
  if (index !== 1 && index !== 3) return false;
  ctx.save();
  ctx.scale(size / 640, size / 640);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 640, 640);
  const poly = (points, color) => {
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  const line = (points, color, width = 2) => {
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  };
  if (index === 1) {
    // An eclipsed star rises behind the terraces of an orbital ship.
    const halo = ctx.createRadialGradient(360, 253, 158, 360, 253, 255);
    halo.addColorStop(0, '#525252'); halo.addColorStop(.45, '#1d1d1d'); halo.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = halo; ctx.fillRect(60, 0, 580, 550);
    const star = ctx.createLinearGradient(175, 95, 485, 417);
    star.addColorStop(0, '#e8e8e8'); star.addColorStop(.62, '#bdbdbd'); star.addColorStop(1, '#686868');
    ctx.beginPath(); ctx.arc(354, 250, 174, 0, Math.PI * 2); ctx.fillStyle = star; ctx.fill();
    ctx.beginPath(); ctx.arc(407, 214, 161, 0, Math.PI * 2); ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(353, 251, 210, 189, -.34, .27, 3.42);
    ctx.strokeStyle = '#7b7b7b'; ctx.lineWidth = 3; ctx.stroke();
    line([[86, 88], [86, 416]], '#cc1515', 7);
    poly([[0,461],[164,388],[348,413],[569,535],[640,622],[0,640]], '#363636');
    poly([[0,461],[164,388],[348,413],[167,477]], '#b8b8b8');
    poly([[167,477],[348,413],[569,535],[394,599]], '#737373');
    poly([[0,516],[166,446],[242,466],[77,536]], '#e8e8e8');
    poly([[0,555],[207,468],[286,491],[78,578]], '#121212');
    poly([[0,574],[258,465],[322,486],[66,596]], '#a6a6a6');
    poly([[46,640],[345,513],[403,535],[157,640]], '#e8e8e8');
    poly([[237,640],[438,557],[490,584],[358,640]], '#898989');
    poly([[129,443],[155,338],[204,320],[220,404]], '#626262');
    poly([[155,338],[204,320],[218,335],[171,353]], '#e8e8e8');
    poly([[155,338],[171,353],[154,447],[129,443]], '#bababa');
    poly([[177,397],[219,384],[220,404],[176,419]], '#cc1515');
    line([[18,477],[161,417],[302,438]], '#454545', 3);
    line([[351,442],[540,547]], '#a7a7a7', 3);
    line([[354,454],[542,560]], '#141414', 7);
  } else {
    // An ivory folded megastructure, viewed from below across a black void.
    const wash = ctx.createLinearGradient(0, 640, 640, 0);
    wash.addColorStop(0, '#2b2b2b'); wash.addColorStop(.55, '#0a0a0a'); wash.addColorStop(1, '#171717');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, 640, 640);
    poly([[71,582],[185,497],[453,89],[513,47],[464,234],[259,541]], '#303030');
    poly([[120,569],[194,521],[413,152],[469,87],[414,286],[252,556]], '#929292');
    poly([[57,503],[268,575],[514,163],[368,93]], '#e8e8e8');
    poly([[268,575],[306,546],[548,164],[514,163]], '#686868');
    poly([[368,93],[405,69],[548,164],[514,163]], '#ababab');
    poly([[115,472],[257,519],[441,207],[345,161]], '#151515');
    poly([[160,469],[255,499],[415,231],[350,201]], '#606060');
    poly([[173,446],[251,472],[395,229],[350,209]], '#0a0a0a');
    poly([[111,493],[148,429],[318,486],[280,550]], '#c6c6c6');
    poly([[162,407],[201,341],[370,398],[332,463]], '#e8e8e8');
    poly([[212,322],[250,258],[420,313],[382,378]], '#d6d6d6');
    poly([[262,237],[300,172],[470,228],[431,293]], '#e8e8e8');
    poly([[312,153],[349,89],[514,163],[479,214]], '#b8b8b8');
    poly([[201,341],[370,398],[370,411],[196,353]], '#686868');
    poly([[250,258],[420,313],[420,327],[245,270]], '#686868');
    poly([[300,172],[470,228],[470,242],[295,185]], '#686868');
    poly([[281,248],[300,214],[340,228],[320,263]], '#cc1515');
    poly([[135,498],[148,477],[177,487],[164,508]], '#cc1515');
    line([[90,529],[239,580]], '#686868', 3);
    line([[449,397],[536,250]], '#474747', 3);
    line([[469,429],[575,250]], '#242424', 8);
    poly([[456,484],[511,390],[531,397],[477,492]], '#cc1515');
  }
  ctx.restore();
  return true;
}
function drawFormationTrace(ctx, w, h, palette) {
  if (!ctx || !Number.isFinite(w) || !Number.isFinite(h) || w < 60 || h < 40) return;
  const red = palette.red;
  const muted = palette.muted;
  const paper = palette.paper;
  const left = Math.max(14, w * 0.075);
  const right = w - left;
  const middle = w * 0.5;
  const low = h * 0.61;
  const high = h * 0.36;
  const span = middle - left;
  const bend = Math.min(24, span * 0.35);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.setLineDash([]);
  ctx.strokeStyle = muted;
  ctx.beginPath();
  ctx.moveTo(left + 8, low);
  ctx.lineTo(middle - bend * 1.8, low);
  ctx.lineTo(middle - bend, high);
  ctx.lineTo(middle - 9, high);
  ctx.moveTo(middle + 9, high);
  ctx.lineTo(right - bend * 1.8, high);
  ctx.lineTo(right - bend, low);
  ctx.lineTo(right - 8, low);
  ctx.stroke();

  const nodes = [[left, low], [middle, high], [right, low]];
  nodes.forEach(([x, y], i) => {
    ctx.strokeStyle = i === 1 ? red : muted;
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x - 6, y);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 9, y);
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y + 9);
    ctx.stroke();

    ctx.strokeStyle = paper;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    if (i === 0) {
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (i === 1) {
      ctx.moveTo(x, y - 4.5);
      ctx.lineTo(x + 4.5, y);
      ctx.lineTo(x, y + 4.5);
      ctx.lineTo(x - 4.5, y);
      ctx.closePath();
      ctx.fillStyle = red;
      ctx.fill();
    } else {
      ctx.rect(x - 3.5, y - 3.5, 7, 7);
      ctx.stroke();
    }

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = muted;
    ctx.fillText(String(i + 1).padStart(2, '0'), x, Math.max(13, y - 13));
  });
  ctx.restore();
}

  function drawShoui(ctx,w,h,palette,progress=1){
    const left=Math.max(24,w*.09),right=w-left,middle=w*.5;
    const low=42,high=25,offset=(1-progress)*8;
    const nodes=[[left-offset,low],[middle,high],[right+offset,low]];
    const indices=[(state.track+tracks.length-1)%tracks.length,state.track,(state.track+1)%tracks.length];
    ctx.save();ctx.lineWidth=.8;ctx.lineJoin='miter';ctx.strokeStyle=palette.muted;
    ctx.save();ctx.beginPath();ctx.rect(0,0,w*progress,h);ctx.clip();
    ctx.beginPath();ctx.moveTo(nodes[0][0]+9,low);
    ctx.lineTo(middle-37,low);ctx.lineTo(middle-20,high);ctx.lineTo(middle-9,high);
    ctx.moveTo(middle+9,high);ctx.lineTo(right-37,high);ctx.lineTo(right-20,low);ctx.lineTo(nodes[2][0]-9,low);ctx.stroke();
    ctx.restore();
    nodes.forEach(([x,y],i)=>{
      ctx.strokeStyle=i===1?palette.red:palette.muted;
      ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x-6,y);ctx.moveTo(x+6,y);ctx.lineTo(x+10,y);
      ctx.moveTo(x,y-10);ctx.lineTo(x,y-6);ctx.moveTo(x,y+6);ctx.lineTo(x,y+10);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y-4.5);ctx.lineTo(x+4.5,y);ctx.lineTo(x,y+4.5);ctx.lineTo(x-4.5,y);ctx.closePath();
      if(i===1){ctx.fillStyle=palette.red;ctx.fill();}else{ctx.strokeStyle=palette.paper;ctx.stroke();}
      ctx.font='11px "JetBrains Mono", monospace';ctx.textAlign='center';ctx.textBaseline='alphabetic';
      ctx.fillStyle=i===1?palette.paper:palette.muted;ctx.fillText(pad(indices[i]+1),x,y-14);
      ctx.fillStyle=i===1?palette.red:palette.muted;ctx.fillText(['PREV','NOW','NEXT'][i],x,69);
    });ctx.restore();
  }
  function drawShipProfile(ctx,w,h,palette){
    const cx=w*.54;
    const line=(points,color=palette.muted)=>{
      ctx.strokeStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    };
    ctx.save();ctx.lineWidth=.75;ctx.lineJoin='miter';ctx.fillStyle=palette.paper;
    ctx.font='11px "JetBrains Mono", monospace';ctx.textAlign='center';ctx.fillText('SIDONIA',w/2,12);
    line([[cx-5,84],[cx-5,25],[cx-2,19],[cx+2,19],[cx+5,25],[cx+5,84]],palette.paper);
    line([[cx-9,74],[cx-9,39],[cx-6,35],[cx+6,35],[cx+9,39],[cx+9,74]]);
    line([[cx,21],[cx,88]]);line([[cx-12,83],[cx+12,83]]);
    for(let y=42;y<78;y+=5)line([[cx-8,y],[cx+8,y]]);
    ctx.fillStyle=palette.red;ctx.fillRect(cx-7,43,3,16);
    line([[cx-11,50],[cx-23,50],[cx-28,55]],palette.red);
    const mass=[[cx-17,86],[cx-10,82],[cx-2,85],[cx+8,82],[cx+20,89],[cx+19,98],[cx+13,106],[cx+3,109],[cx-8,106],[cx-20,101],[cx-24,92],[cx-17,86]];
    line(mass,palette.paper);
    line([[cx-17,86],[cx-10,94],[cx-20,101]]);
    line([[cx-10,94],[cx+1,90],[cx+8,82]]);line([[cx+1,90],[cx+8,99],[cx+19,98]]);
    line([[cx+8,99],[cx+3,109]]);line([[cx-10,94],[cx-8,106]]);
    ctx.fillStyle=palette.muted;ctx.fillText('SEED SHIP',w/2,h-2);ctx.restore();
  }
  function drawGaunaSpecimen(ctx,w,h,palette){
    const cx=w*.5,cy=60;
    ctx.save();ctx.lineWidth=.8;ctx.lineJoin='round';
    ctx.font='11px "JetBrains Mono", monospace';ctx.textAlign='center';ctx.fillStyle=palette.paper;ctx.fillText('GAUNA',cx,12);
    ctx.beginPath();ctx.moveTo(cx-9,cy-26);
    ctx.bezierCurveTo(cx-25,cy-25,cx-30,cy-7,cx-22,cy+2);
    ctx.bezierCurveTo(cx-34,cy+17,cx-19,cy+25,cx-12,cy+22);
    ctx.bezierCurveTo(cx-1,cy+37,cx+19,cy+23,cx+16,cy+13);
    ctx.bezierCurveTo(cx+34,cy+9,cx+29,cy-13,cx+17,cy-13);
    ctx.bezierCurveTo(cx+14,cy-32,cx,cy-34,cx-9,cy-26);
    ctx.closePath();ctx.fillStyle='#200e0d';ctx.fill();ctx.strokeStyle=palette.red;ctx.stroke();
    ctx.strokeStyle=palette.muted;ctx.globalAlpha=.65;
    ctx.beginPath();ctx.moveTo(cx-11,cy-18);ctx.bezierCurveTo(cx-26,cy-3,cx-7,cy+9,cx-17,cy+16);
    ctx.moveTo(cx+9,cy-19);ctx.bezierCurveTo(cx+27,cy-4,cx+5,cy+8,cx+10,cy+19);ctx.stroke();
    ctx.globalAlpha=1;ctx.strokeStyle=palette.red;
    ctx.beginPath();ctx.moveTo(cx-13,cy-25);ctx.bezierCurveTo(cx-34,cy-45,cx-42,cy-37,cx-35,cy-42);
    ctx.moveTo(cx+22,cy-6);ctx.bezierCurveTo(cx+45,cy-7,cx+31,cy+19,cx+41,cy+26);
    ctx.moveTo(cx-16,cy+23);ctx.bezierCurveTo(cx-33,cy+29,cx-22,cy+41,cx-36,cy+43);
    ctx.moveTo(cx+2,cy+28);ctx.bezierCurveTo(cx+1,cy+43,cx+23,cy+29,cx+30,cy+43);ctx.stroke();
    ctx.beginPath();ctx.arc(cx-1,cy-1,4,0,Math.PI*2);ctx.fillStyle=palette.red;ctx.fill();
    ctx.strokeStyle=palette.paper;ctx.beginPath();ctx.arc(cx-1,cy-1,7,-.9,1.8);ctx.stroke();
    ctx.fillStyle=palette.muted;ctx.fillText('ENA // CORE',cx,h-2);ctx.restore();
  }
  function drawKabizashi(ctx,w,h,palette){
    const horizontal=w>h,len=horizontal?w:h;
    ctx.save();
    if(horizontal){ctx.translate(0,h/2);ctx.rotate(-Math.PI/2);}else ctx.translate(w/2,0);
    ctx.strokeStyle=palette.paper;ctx.lineWidth=.85;ctx.lineJoin='miter';
    ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(5,24);ctx.lineTo(2,38);ctx.lineTo(1.4,len-12);
    ctx.lineTo(-1.4,len-12);ctx.lineTo(-2,38);ctx.lineTo(-5,24);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(0,38);ctx.stroke();
    ctx.fillStyle=palette.red;ctx.fillRect(-2,42,4,9);
    ctx.strokeStyle=palette.muted;
    [len*.46,len*.73].forEach(y=>{
      ctx.strokeRect(-3.5,y,7,8);ctx.beginPath();ctx.moveTo(-8,y+4);ctx.lineTo(-4,y+4);ctx.moveTo(4,y+4);ctx.lineTo(8,y+4);ctx.stroke();
    });
    ctx.beginPath();ctx.moveTo(-4,len-12);ctx.lineTo(4,len-12);ctx.moveTo(0,len-12);ctx.lineTo(0,len-5);ctx.stroke();ctx.restore();
  }
  function prepareCanvas(target,w,h){
    const dpr=Math.min(2,globalThis.devicePixelRatio||1);
    target.width=Math.max(1,Math.round(w*dpr));target.height=Math.max(1,Math.round(h*dpr));
    const ctx=target.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return ctx;
  }
  function renderDetail(force=false){
    const variant=String(design.detail),alpha=String(design.markingContrast/100);
    root.dataset.mode=variant;
    const armour=root.querySelector('[data-armour]'),plate=root.querySelector('[data-id-plate]');
    const engraving=root.querySelector('[data-engraving-canvas]'),spear=root.querySelector('[data-kabizashi]');
    armour.hidden=variant!=='2';plate.hidden=variant!=='3';engraving.hidden=variant!=='4'&&variant!=='6';spear.hidden=variant!=='5';
    [detailSlot,armour,plate,engraving,spear].forEach(el=>el.style.opacity=alpha);
    root.querySelectorAll('[data-detail]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.detail===variant)));
    root.querySelector('[data-detail-count]').textContent=pad(Number(variant))+' / 06';
    detailCanvas.setAttribute('aria-label',variant==='1'?'Shōi-inspired formation of previous, current and next track. The red centre is the current track.':'Selected formation-link decorative marking beneath the track title');
    const w=Math.max(1,Math.round(detailSlot.getBoundingClientRect().width));
    const spearRect=variant==='5'?spear.getBoundingClientRect():{width:0,height:0};
    const key=[variant,state.track,w,spearRect.width,spearRect.height,globalThis.devicePixelRatio||1].join('|');
    if(!force&&key===detailKey)return;detailKey=key;
    const palette={red:'#c33327',muted:'#947b6b',paper:'#c2b29d'};
    const ctx=prepareCanvas(detailCanvas,w,72);
    if(variant==='1'){
      const progress=formationStarted?clamp((performance.now()-formationStarted)/460):1;
      drawShoui(ctx,w,72,palette,1-Math.pow(1-progress,3));
    }else drawFormationTrace(ctx,w,72,palette);
    if(variant==='4'||variant==='6'){
      const ec=prepareCanvas(engraving,92,126);
      engraving.setAttribute('aria-label',variant==='4'?'Sidonia-inspired ship profile with its resource mass and a red habitation marker':'Gauna-inspired specimen outline with a red core, shown in the missing-artwork preview');
      if(variant==='4')drawShipProfile(ec,92,126,palette);else drawGaunaSpecimen(ec,92,126,palette);
    }
    if(variant==='5'&&spearRect.width&&spearRect.height){
      const sc=prepareCanvas(root.querySelector('[data-spear-canvas]'),spearRect.width,spearRect.height);
      drawKabizashi(sc,spearRect.width,spearRect.height,palette);
    }
  }
  function stopFormation(){
    if(formationRaf)cancelAnimationFrame(formationRaf);
    formationRaf=0;formationStarted=0;
  }
  function animateFormation(){
    stopFormation();
    if(design.detail!=='1'||reduced.matches||!inView||document.hidden)return;
    formationStarted=performance.now();renderDetail(true);
    const tick=()=>{
      formationRaf=0;
      if(!root.isConnected||document.hidden||!inView||design.detail!=='1'){stopFormation();return;}
      if(performance.now()-formationStarted>=460){formationStarted=0;renderDetail(true);return;}
      renderDetail(true);formationRaf=requestAnimationFrame(tick);
    };
    formationRaf=requestAnimationFrame(tick);
  }
  function createGlyphRenderer(target) {
    const ctx=target.getContext('2d'),size=640,cols=32,cell=20;
    const mask=makeCanvas(),overlay=makeCanvas();
    const mc=mask.getContext('2d'),oc=overlay.getContext('2d');
    let frame=null,transition=null,raf=0,visible=true,paintCount=0;
    let pointer={active:false,x:0,y:0},trails=[];
    const snapshot=()=>{const c=makeCanvas();c.getContext('2d').drawImage(target,0,0);return c;};
    function compile(source,key) {
      const sourceCopy=source?makeCanvas():null;
      const seed=hash(key),rand=random(seed),raw=[],red=[];
      if(source){
        sourceCopy.getContext('2d').drawImage(source,0,0,size,size);
        const sample=document.createElement('canvas');sample.width=128;sample.height=128;
        const sc=sample.getContext('2d');sc.drawImage(sourceCopy,0,0,128,128);const pixels=sc.getImageData(0,0,128,128).data;
        for(let row=0;row<cols;row++)for(let col=0;col<cols;col++){
          let r=0,g=0,b=0;
          for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const p=((row*4+dy)*128+col*4+dx)*4;r+=pixels[p];g+=pixels[p+1];b+=pixels[p+2];}
          raw.push((r*.2126+g*.7152+b*.0722)/(16*255));red.push(r>g*1.42&&r>b*1.28&&r/16>62);
        }
      }else{
        const cx=.25+rand()*.50,cy=.28+rand()*.44,radius=.19+rand()*.15,angle=rand()*Math.PI,offset=rand()*.25-.125;
        for(let row=0;row<cols;row++)for(let col=0;col<cols;col++){
          const x=(col+.5)/cols,y=(row+.5)/cols,dist=Math.hypot(x-cx,y-cy);
          const ring=Math.exp(-Math.abs(dist-radius)*50);
          const inner=Math.exp(-Math.abs(dist-radius*.54)*60)*.48;
          const axis=Math.exp(-Math.abs((x-.5)*Math.cos(angle)+(y-.5)*Math.sin(angle)-offset)*55)*.70;
          const field=clamp(ring*.82+inner+axis+(rand()>.95?.24:0));raw.push(field);red.push(axis>.53&&dist<radius*1.13);
        }
      }
      const sorted=[...raw].sort((a,b)=>a-b),p05=sorted[51],p95=sorted[972];
      const adaptive=source&&p95-p05>.10,lo=adaptive?Math.max(0,p05-.02):0,hi=adaptive?Math.min(1,p95+.06):1;
      const ramp=' .:;=+x*#%@',cells=[];
      for(let row=0;row<cols;row++)for(let col=0;col<cols;col++){
        const i=row*cols+col,tone=Math.pow(clamp((raw[i]-lo)/Math.max(.27,hi-lo)),.72);
        let char=ramp[Math.min(ramp.length-1,Math.floor(tone*(ramp.length-1)))];
        const gx=raw[row*cols+Math.min(cols-1,col+1)]-raw[row*cols+Math.max(0,col-1)];
        const gy=raw[Math.min(cols-1,row+1)*cols+col]-raw[Math.max(0,row-1)*cols+col];
        if(tone>.16&&tone<.55&&Math.hypot(gx,gy)>.23){char=Math.abs(gx)>Math.abs(gy)*1.8?'|':Math.abs(gy)>Math.abs(gx)*1.8?'=':gx*gy>0?'\\':'/';}
        cells.push({x:col*cell,y:row*cell,char,tone,alpha:.24+.76*Math.sqrt(tone),red:red[i],noise:((Math.imul(i+1,2654435761)^seed)>>>0)/4294967296});
      }
      const base=makeCanvas(),bc=base.getContext('2d');bc.fillStyle='#090909';bc.fillRect(0,0,size,size);setFont(bc);
      for(const c of cells)paintGlyph(bc,c,c.x,c.y,1);
      return {source:sourceCopy,base,cells,key,seed};
    }
    function setFont(c){c.font='19px monospace';c.textAlign='center';c.textBaseline='middle';}
    function paintGlyph(c,g,x,y,opacity){c.globalAlpha=g.alpha*opacity;c.fillStyle=g.red?'#e4372b':'#e8e8df';c.fillText(g.char,x+cell/2,y+cell/2);c.globalAlpha=1;}
    function drawTransition(now){
      const p=clamp((now-transition.started)/720);
      if(p>=1){transition=null;ctx.drawImage(frame.base,0,0);return;}
      setFont(ctx);
      for(const g of frame.cells){
        const u=clamp((p-g.noise*.16)/.84),out=smooth(.04,.65,u),incoming=smooth(.32,1,u);
        const dx=Math.sin(g.noise*40)*cell*1.35,dy=Math.cos(g.noise*31)*cell*1.35;
        if(out<1){ctx.globalAlpha=1-out;ctx.drawImage(transition.old,g.x,g.y,cell,cell,g.x+dx*out,g.y+dy*out,cell,cell);ctx.globalAlpha=1;}
        if(incoming>0)paintGlyph(ctx,g,g.x-dx*(1-incoming)*.65,g.y-dy*(1-incoming)*.65,incoming);
        if(u>.18&&u<.64){ctx.globalAlpha=Math.sin((u-.18)/.46*Math.PI)*.24;ctx.fillStyle=g.red?'#cc1515':'#b0a69d';ctx.fillText('+x/\\'[Math.floor(g.noise*17+u*10)%4],g.x+cell/2,g.y+cell/2);ctx.globalAlpha=1;}
      }
    }
    function stamp(x,y,strength){
      const radius=size*design.revealRadius/100;
      const gradient=mc.createRadialGradient(x,y,radius*.22,x,y,radius);
      gradient.addColorStop(0,'rgba(255,255,255,'+strength+')');gradient.addColorStop(.48,'rgba(255,255,255,'+strength*.83+')');gradient.addColorStop(1,'rgba(255,255,255,0)');mc.fillStyle=gradient;mc.fillRect(x-radius,y-radius,radius*2,radius*2);
    }
    function draw(now=performance.now()){
      if(!frame)return;paintCount++;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#090909';ctx.fillRect(0,0,size,size);
      if(transition)drawTransition(now);else ctx.drawImage(frame.base,0,0);
      trails=trails.filter(p=>now-p.born<620);
      if(frame.source&&!transition){
        if(pointer.active||trails.length){
          mc.clearRect(0,0,size,size);
          for(const p of trails)stamp(p.x,p.y,Math.pow(1-clamp((now-p.born)/620),1.7)*(p.strength??.68));
          if(pointer.active)stamp(pointer.x,pointer.y,1);
          oc.globalCompositeOperation='source-over';oc.clearRect(0,0,size,size);oc.drawImage(frame.source,0,0);
          oc.globalCompositeOperation='destination-in';oc.drawImage(mask,0,0);oc.globalCompositeOperation='source-over';ctx.drawImage(overlay,0,0);
        }
      }
    }
    function tick(now){raf=0;if(!visible||!root.isConnected)return;draw(now);if(transition||trails.length)raf=requestAnimationFrame(tick);}
    function wake(){if(!visible||!root.isConnected)return;if(!raf&&(transition||trails.length))raf=requestAnimationFrame(tick);}
    function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;}
    function clearReveal(){pointer.active=false;trails=[];}
    return {
      setSource(source,key,animate=true){
        if(frame)draw();const old=frame?snapshot():null;cancel();clearReveal();frame=compile(source,key);
        transition=old&&animate&&!reduced.matches&&visible?{old,started:performance.now()}:null;
        draw();wake();
      },
      pointer(x,y){
        if(!frame?.source||transition||!visible)return;
        const now=performance.now(),px=clamp(x)*size,py=clamp(y)*size;
        if(pointer.active&&!reduced.matches){
          const dx=px-pointer.x,dy=py-pointer.y,steps=Math.min(16,Math.ceil(Math.hypot(dx,dy)/18));
          for(let i=1;i<=steps;i++)trails.push({x:pointer.x+dx*i/steps,y:pointer.y+dy*i/steps,born:now});
          if(trails.length>36)trails=trails.slice(-36);
        }
        pointer={active:true,x:px,y:py};draw(now);wake();
      },
      leave(){
        if(pointer.active&&!reduced.matches&&frame?.source)trails.push({x:pointer.x,y:pointer.y,born:performance.now(),strength:1});
        pointer.active=false;if(reduced.matches)trails=[];draw();wake();
      },
      setVisible(value){visible=value;if(!visible){cancel();transition=null;clearReveal();}draw();if(visible)wake();},
      motionChanged(){if(reduced.matches){cancel();transition=null;trails=[];draw();}},
      repaint(){draw();},
      info(){return {key:frame?.key,hasCover:!!frame?.source,transition:!!transition,trails:trails.length,raf,paintCount};}
    };
  }
  const renderer=createGlyphRenderer(canvas);
  function hasCover(){return tracks[state.track].cover&&!design.missingArtwork&&design.detail!=='6';}
  function syncCoverStatus(){
    const available=hasCover();
    root.querySelector('[data-cover-state]').textContent=available?'COVER // AVAILABLE':'NO COVER // TRACK SIGNATURE';
    root.querySelector('[data-glyph-status]').textContent=design.detail==='6'?'GAUNA // MISSING-COVER STUDY':available?'ARTWORK RECONSTRUCTION':'TRACK SIGNATURE';
    canvas.setAttribute('aria-label',!available?'Stable generated glyph signature for '+tracks[state.track].title+'. No album artwork available.':'Album artwork reconstructed as glyphs. Move over it to reveal the original cover.');
  }
  function updateCover(animate=true){
    const track=tracks[state.track],source=hasCover()?makeCanvas():null;
    if(source)drawSampleCover(source.getContext('2d'),state.track);
    renderer.setSource(source,track.title+'\u0000'+track.artist,animate);syncCoverStatus();
  }
  function render(){
    const track=tracks[state.track],values={title:track.title,artist:track.artist,album:track.album,index:pad(state.track+1),status:state.playing?'PLAYING':'PAUSED',elapsed:time(state.position),duration:time(track.length)};
    root.querySelectorAll('[data-field]').forEach(el=>el.textContent=values[el.dataset.field]||'');
    const play=root.querySelector('[data-action="play"]');root.querySelector('[data-play-label]').textContent=state.playing?'PAUSE':'PLAY';play.setAttribute('aria-label',state.playing?'Pause sample playback':'Play sample playback');root.classList.toggle('ps-playing',state.playing);
    const seek=root.querySelector('[data-seek]');seek.max=track.length;seek.value=Math.floor(state.position);seek.style.setProperty('--ps-progress',(state.position/track.length*100)+'%');seek.setAttribute('aria-valuetext',time(state.position)+' of '+time(track.length));
    root.querySelectorAll('[data-track]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.track)===state.track)));
    renderDetail();
  }
  function selectTrack(index){const next=(index+tracks.length)%tracks.length;if(next===state.track)return;state.track=next;state.position=0;updateCover();render();animateFormation();say(pad(next+1)+' // '+tracks[next].title+(hasCover()?'':'. No cover, showing track signature.'));}
  function stopClock(){if(clock!==null)clearInterval(clock);clock=null;}
  function syncClock(){
    stopClock();if(!state.playing||document.hidden||!inView||!root.isConnected)return;lastTick=performance.now();
    clock=setInterval(()=>{if(!root.isConnected){stopClock();return;}const now=performance.now();state.position+=Math.min(1.5,(now-lastTick)/1000);lastTick=now;if(state.position>=tracks[state.track].length)selectTrack(state.track+1);else render();},250);
  }
  function syncVisibility(){if(document.hidden||!inView)stopFormation();renderer.setVisible(!document.hidden&&inView);renderDetail(true);syncCoverStatus();syncClock();}
  const library=root.querySelector('[data-library]');
  root.querySelector('[data-track-count]').textContent=pad(tracks.length);
  tracks.forEach((track,i)=>{
    const button=document.createElement('button');button.type='button';button.className='ps-track';button.dataset.track=String(i);
    const marker=document.createElement('span');marker.className='ps-track-marker';marker.setAttribute('data-selected-marker','');marker.setAttribute('aria-hidden','true');
    const diamond=document.createElement('i');diamond.setAttribute('data-lucide','diamond');marker.append(diamond);
    const number=document.createElement('span');number.className='ps-track-number';number.textContent=pad(i+1)+' //';
    const copy=document.createElement('span');copy.className='ps-track-copy';
    const title=document.createElement('span');title.className='ps-track-title';title.textContent=track.title;
    const artist=document.createElement('span');artist.className='ps-track-artist';artist.textContent=track.artist+(track.cover?'':' // NO COVER');copy.append(title,artist);
    const length=document.createElement('span');length.className='ps-track-length';length.textContent=time(track.length);button.append(marker,number,copy,length);library.append(button);
  });
  if(globalThis.lucide)globalThis.lucide.createIcons({attrs:{width:16,height:16}});
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.dataset.detail!==undefined){
      const hadCover=hasCover();stopFormation();design.detail=button.dataset.detail;
      if(hadCover!==hasCover())updateCover(false);else syncCoverStatus();
      renderDetail();say(detailNames[Number(design.detail)-1]+' preview selected.');return;
    }
    if(button.dataset.track!==undefined){selectTrack(Number(button.dataset.track));return;}
    const action=button.dataset.action;
    if(action==='play'){state.playing=!state.playing;render();syncClock();say(state.playing?'Sample playback playing. No audio.':'Paused.');}
    else if(action==='prev'||action==='next'){selectTrack(state.track+(action==='next'?1:-1));syncClock();}
    else if(action==='library'){library.hidden=!library.hidden;button.setAttribute('aria-expanded',String(!library.hidden));root.querySelector('[data-library-label]').textContent=library.hidden?'TRACKS':'CLOSE';}
  });
  root.addEventListener('input',event=>{if(event.target.matches('[data-seek]')){state.position=clamp(Number(event.target.value),0,tracks[state.track].length);lastTick=performance.now();render();}});
  root.addEventListener('change',event=>{if(event.target.matches('[data-seek]'))say('Position '+time(state.position));});
  function point(event){const r=canvas.getBoundingClientRect();if(r.width&&r.height)renderer.pointer((event.clientX-r.left)/r.width,(event.clientY-r.top)/r.height);}
  canvas.addEventListener('pointermove',point);canvas.addEventListener('pointerdown',point);
  canvas.addEventListener('pointerleave',()=>renderer.leave());canvas.addEventListener('pointercancel',()=>renderer.leave());
  canvas.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')renderer.leave();});
  document.addEventListener('visibilitychange',syncVisibility);reduced.addEventListener('change',()=>{renderer.motionChanged();if(reduced.matches){stopFormation();renderDetail(true);}});
  if(globalThis.IntersectionObserver){const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncVisibility();},{threshold:0});observer.observe(root);}
  updateCover(false);render();
  if(globalThis.ResizeObserver){const observer=new ResizeObserver(()=>renderDetail());observer.observe(detailSlot);observer.observe(root.querySelector('.ps-a-matrix'));}
  if(document.fonts)document.fonts.ready.then(()=>{if(root.isConnected)renderDetail(true);});
  if(globalThis.Tweak){
    let previousMissing=design.missingArtwork;
    const tweak=new Tweak({container:root,onChange:()=>{renderDetail();if(previousMissing!==design.missingArtwork){previousMissing=design.missingArtwork;updateCover();}else renderer.repaint();}});
    tweak.addToggle(design,'missingArtwork',{label:'Simulate missing artwork'});
    tweak.addSlider(design,'revealRadius',{label:'Reveal radius',min:7.2,max:16.8,step:.1,unit:'%'});
    tweak.addSlider(design,'markingContrast',{label:'Marking contrast',min:40,max:100,step:1,unit:'%'});
  }
})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-detail=\"1\"]"}], "remove": ["button[data-detail]"], "controls": false});
