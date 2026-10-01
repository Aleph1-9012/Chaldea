
(() => {
  const root = document.getElementById('tsugumori-player-buttons');
  if (!root) return;
  const tracks = [
    {title:'SIDONIA',artist:'angela',album:'KNIGHTS OF SIDONIA',length:263},
    {title:'OUTER HULL',artist:'Tsugumori archive',album:'ORBITAL STUDIES / 02',length:218},
    {title:'GARDES AT DAWN',artist:'Tsugumori archive',album:'ORBITAL STUDIES / 03',length:307},
    {title:'THE LONG WAY HOME // ORBITAL ARCHIVE',artist:'Tsugumori archive',album:'HOMEBOUND / 04',length:346}
  ];
  const names = {brackets:'01 // CORNER KEYS',console:'02 // CONSOLE STRIP',type:'03 // TYPE KEYS',inset:'04 // INSET KEYS'};
  const state = {design:'brackets',track:0,position:84,playing:false,libraryOpen:false};
  const design = {artwork:true,glyphContrast:1,grid:true};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const announcement = root.querySelector('[data-announcement]');
  const art = document.createElement('canvas'); art.width=640; art.height=640;
  const ac = art.getContext('2d');
  let interval = null, lastTick = 0, inView = true, matrixFrame = 0;
  const pad = n => String(n).padStart(2,'0');
  const time = value => { const s=Math.max(0,Math.floor(value)); return pad(Math.floor(s/60))+':'+pad(s%60); };
  const say = text => { announcement.textContent = text; };
  function polygon(ctx,points,fill,stroke) {
    ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();}
  }
  function makeArtwork() {
    const c=ac, s=640, index=state.track;
    c.clearRect(0,0,s,s); c.fillStyle='#111313';c.fillRect(0,0,s,s);
    const bg=c.createRadialGradient(332,250,8,335,290,450); bg.addColorStop(0,'#89968f');bg.addColorStop(.3,'#3b4641');bg.addColorStop(1,'#090b0b');c.fillStyle=bg;c.fillRect(0,0,s,s);
    if(!design.artwork) {
      c.fillStyle='#101010';c.fillRect(0,0,s,s);c.fillStyle='#54443c';c.font='240px monospace';c.textAlign='center';c.fillText(pad(index+1),320,368);
      c.font='19px monospace';c.fillStyle='#b9afa6';c.fillText('NO COVER ART',320,432);c.textAlign='left';return;
    }
    let seed=17047+index*1943;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    c.save();c.translate(322,318);c.rotate((index-1)*.075);c.translate(-322,-318);
    // A printed architectural study. Each plate converges on the open shaft.
    const van={x:340,y:271};
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
function clamp(v, low, high) { return Math.max(low, Math.min(high, v)) }
function smoothStep(a, b, v) { var p = clamp((v - a) / (b - a), 0, 1); return p * p * (3 - 2 * p) }
function hash(text) {
        var h = 2166136261
        for (var i = 0; i < text.length; ++i) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
        return h >>> 0
    }
function hoverColour(rgb) {
        var peak = Math.max(rgb.r, rgb.g, rgb.b)
        var span = peak - Math.min(rgb.r, rgb.g, rgb.b)
        var value = Math.min(1, Math.pow(peak, 0.65) * 1.18)
        // Lift brightness and saturation without shifting the artwork's hue.
        if (span < 0.00001) return { r: value, g: value, b: value }
        var saturation = Math.min(1, span / peak * 1.65)
        return {
            r: value * (1 - (peak - rgb.r) / span * saturation),
            g: value * (1 - (peak - rgb.g) / span * saturation),
            b: value * (1 - (peak - rgb.b) / span * saturation)
        }
    }
function compileCells(raw, red, seed, adaptive, colours) {
        var sorted = raw.slice().sort(function(a, b) { return a - b })
        var lo = adaptive && sorted[972] - sorted[51] > 0.1 ? Math.max(0, sorted[51] - 0.02) : 0
        var hi = adaptive && sorted[972] - sorted[51] > 0.1 ? Math.min(1, sorted[972] + 0.06) : 1
        var ramp = " .:;=+x*#%@", result = []
        for (var row = 0; row < 32; ++row) for (var col = 0; col < 32; ++col) {
            var index = row * 32 + col
            var tone = Math.pow(clamp((raw[index] - lo) / Math.max(0.27, hi - lo), 0, 1), 0.72)
            var glyph = ramp[Math.min(ramp.length - 1, Math.floor(tone * (ramp.length - 1)))]
            var gx = raw[row * 32 + Math.min(31, col + 1)] - raw[row * 32 + Math.max(0, col - 1)]
            var gy = raw[Math.min(31, row + 1) * 32 + col] - raw[Math.max(0, row - 1) * 32 + col]
            if (tone > 0.16 && tone < 0.55 && Math.sqrt(gx * gx + gy * gy) > 0.23)
                glyph = Math.abs(gx) > Math.abs(gy) * 1.8 ? "|" : Math.abs(gy) > Math.abs(gx) * 1.8 ? "=" : gx * gy > 0 ? "\\" : "/"
            result.push({ glyph: glyph, alpha: 0.24 + 0.76 * Math.sqrt(tone), red: red[index],
                          rgb: colours ? hoverColour(colours[index]) : null,
                          noise: ((Math.imul(index + 1, 2654435761) ^ seed) >>> 0) / 4294967296 })
        }
        return result
    }
  const glyphCanvas=root.querySelector('[data-matrix]');
  const sampleCanvas=document.createElement('canvas');sampleCanvas.width=128;sampleCanvas.height=128;
  const sampleContext=sampleCanvas.getContext('2d');
  let cells=[],oldCells=[],hoverFrame=0;
  const hover={pointerPresent:false,x:0,y:0,points:[]};
  const trailDuration=1100,maxTrailPoints=64,revealRadius=640*.171;
  function clearHover(repaint=true) {
    cancelAnimationFrame(hoverFrame);hoverFrame=0;hover.pointerPresent=false;hover.points=[];
    if(repaint)drawMatrix();
  }
  function renderArt(animate=false) {
    clearHover(false);makeArtwork();sampleContext.clearRect(0,0,128,128);sampleContext.drawImage(art,0,0,128,128);
    const pixels=sampleContext.getImageData(0,0,128,128).data,raw=[],reds=[],colours=[];
    for(let row=0;row<32;row++)for(let col=0;col<32;col++){
      let r=0,g=0,b=0;
      for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
        const p=((row*4+dy)*128+col*4+dx)*4;r+=pixels[p];g+=pixels[p+1];b+=pixels[p+2];
      }
      raw.push((r*.2126+g*.7152+b*.0722)/(16*255));
      reds.push(r>g*1.42&&r>b*1.28&&r/16>62);colours.push({r:r/(16*255),g:g/(16*255),b:b/(16*255)});
    }
    oldCells=animate?cells:[];
    cells=compileCells(raw,reds,hash(tracks[state.track].title+'\u0000'+tracks[state.track].artist),true,colours);
    drawMatrix(animate&&!reduced.matches&&oldCells.length?0:1);
  }
  function hoverAmounts(now=performance.now()) {
    const amounts=new Array(1024).fill(0),cellW=20,radius=revealRadius;
    function stamp(x,y,strength){
      const left=Math.max(0,Math.floor((x-radius)/cellW)),right=Math.min(31,Math.floor((x+radius)/cellW));
      const top=Math.max(0,Math.floor((y-radius)/cellW)),bottom=Math.min(31,Math.floor((y+radius)/cellW));
      for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
        const dx=(col+.5)*cellW-x,dy=(row+.5)*cellW-y,distance=Math.hypot(dx,dy);
        if(distance>=radius)continue;
        const index=row*32+col,amount=strength*(1-smoothStep(radius*.22,radius,distance));
        amounts[index]=Math.max(amounts[index],amount);
      }
    }
    for(const point of hover.points){
      const strength=Math.pow(1-clamp((now-point.born)/trailDuration,0,1),1.7)*point.strength;
      if(strength>0)stamp(point.x,point.y,strength);
    }
    if(hover.pointerPresent)stamp(hover.x,hover.y,1);
    return amounts;
  }
  function drawCells(ctx,frame,progress,outgoing,amounts) {
    ctx.font='19px "JetBrains Mono", "DejaVu Sans Mono", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<frame.length;i++){
      const g=frame[i];let x=(i%32+.5)*20,y=(Math.floor(i/32)+.5)*20,alpha=1;
      if(progress<1){
        const u=clamp((progress-g.noise*.16)/.84,0,1),motion=outgoing?smoothStep(.04,.65,u):1-smoothStep(.32,1,u);
        alpha=1-motion;x+=Math.sin(g.noise*40)*20*1.35*motion*(outgoing?1:-.65);y+=Math.cos(g.noise*31)*20*1.35*motion*(outgoing?1:-.65);
      }
      if(alpha<=0)continue;
      const baseAlpha=Math.min(1,g.alpha*design.glyphContrast);
      ctx.globalAlpha=baseAlpha*alpha;ctx.fillStyle=g.red?'#e4372b':'#e8e8df';
      if(g.rgb&&amounts&&amounts[i]>0){
        const mix=1-Math.pow(1-amounts[i],1.6),r=g.red?228/255:232/255,green=g.red?55/255:232/255,b=g.red?43/255:223/255;
        ctx.globalAlpha=(baseAlpha+(1-baseAlpha)*mix)*alpha;
        ctx.fillStyle='rgb('+[(r+(g.rgb.r-r)*mix)*255,(green+(g.rgb.g-green)*mix)*255,(b+(g.rgb.b-b)*mix)*255].join(',')+')';
      }
      ctx.fillText(g.glyph,x,y);
    }
    ctx.globalAlpha=1;
  }
  function drawMatrix(progress=1) {
    const ctx=glyphCanvas.getContext('2d');ctx.fillStyle='#090909';ctx.fillRect(0,0,640,640);
    if(progress<1&&oldCells.length)drawCells(ctx,oldCells,progress,true);
    drawCells(ctx,cells,progress,false,progress===1?hoverAmounts():null);
  }
  function settleMatrix() {
    cancelAnimationFrame(matrixFrame);matrixFrame=0;
    if(reduced.matches||document.hidden||!inView||!oldCells.length){oldCells=[];drawMatrix();return;}
    clearHover(false);const start=performance.now();
    const step=now=>{
      if(!root.isConnected||document.hidden||!inView){matrixFrame=0;oldCells=[];drawMatrix();return;}
      const progress=Math.min(1,(now-start)/720);drawMatrix(progress);
      if(progress<1)matrixFrame=requestAnimationFrame(step);else{matrixFrame=0;oldCells=[];}
    };
    matrixFrame=requestAnimationFrame(step);
  }
  function startHoverFrames() {
    if(hoverFrame||reduced.matches||!hover.points.length)return;
    const step=now=>{
      hoverFrame=0;
      if(!root.isConnected||document.hidden||!inView){clearHover();return;}
      hover.points=hover.points.filter(point=>now-point.born<trailDuration);
      if(!matrixFrame)drawMatrix();
      if(hover.points.length)hoverFrame=requestAnimationFrame(step);
    };
    hoverFrame=requestAnimationFrame(step);
  }
  function movePointer(event) {
    if(document.hidden||!inView||matrixFrame||!cells.length)return;
    const rect=glyphCanvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const x=clamp((event.clientX-rect.left)/rect.width*640,0,640),y=clamp((event.clientY-rect.top)/rect.height*640,0,640),now=performance.now();
    if(hover.pointerPresent&&!reduced.matches){
      const dx=x-hover.x,dy=y-hover.y,count=Math.min(16,Math.ceil(Math.hypot(dx,dy)/18));
      for(let i=1;i<=count;i++)hover.points.push({x:hover.x+dx*i/count,y:hover.y+dy*i/count,born:now,strength:.68});
    }
    hover.x=x;hover.y=y;hover.pointerPresent=true;hover.points=hover.points.slice(-maxTrailPoints);
    drawMatrix();startHoverFrames();
  }
  function leavePointer() {
    if(hover.pointerPresent&&!reduced.matches){
      hover.points=hover.points.slice(1-maxTrailPoints);hover.points.push({x:hover.x,y:hover.y,born:performance.now(),strength:1});
    }
    hover.pointerPresent=false;if(reduced.matches)hover.points=[];drawMatrix();startHoverFrames();
  }
  glyphCanvas.addEventListener('pointerenter',movePointer);
  glyphCanvas.addEventListener('pointermove',movePointer);
  glyphCanvas.addEventListener('pointerdown',movePointer);
  glyphCanvas.addEventListener('pointerleave',leavePointer);
  glyphCanvas.addEventListener('pointercancel',leavePointer);
  glyphCanvas.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leavePointer();});
  if(globalThis.ResizeObserver){const resize=new ResizeObserver(()=>{clearHover(false);if(!matrixFrame)drawMatrix();});resize.observe(glyphCanvas);}
  if(globalThis.window)window.addEventListener('blur',()=>clearHover());

  function renderLibraries() {
    root.querySelectorAll('[data-library]').forEach(library=>{
      tracks.forEach((track,i)=>{
        const button=document.createElement('button');button.type='button';button.className='ps-track';button.dataset.track=String(i);button.setAttribute('aria-pressed',String(i===state.track));
        const number=document.createElement('span');number.className='ps-track-number';number.textContent=pad(i+1)+' //';
        const copy=document.createElement('span');copy.className='ps-track-copy';
        const title=document.createElement('span');title.className='ps-track-title';title.textContent=track.title;
        const artist=document.createElement('span');artist.className='ps-track-artist';artist.textContent=track.artist;
        copy.append(title,artist);
        const length=document.createElement('span');length.className='ps-track-length';length.textContent=time(track.length);
        button.append(number,copy,length);library.append(button);
      });
    });
  }
  function render() {
    const track=tracks[state.track];
    const values={title:track.title,artist:track.artist,album:track.album,index:pad(state.track+1),elapsed:time(state.position),duration:time(track.length),status:state.playing?'PLAYING':'PAUSED',source:'LOCAL'};
    root.querySelectorAll('[data-field]').forEach(el=>{el.textContent=values[el.dataset.field]??'';});
    root.classList.toggle('ps-playing',state.playing);root.classList.toggle('pa-grid',design.grid);
    root.querySelectorAll('[data-action="play"]').forEach(el=>{el.querySelector('[data-transport-label]').textContent=state.playing?'PAUSE':'PLAY';el.setAttribute('aria-label',state.playing?'Pause sample playback':'Play sample playback');});
    root.querySelectorAll('[data-seek]').forEach(el=>{el.max=track.length;el.value=Math.floor(state.position);el.style.setProperty('--ps-progress',(state.position/track.length*100)+'%');el.setAttribute('aria-valuetext',time(state.position)+' of '+time(track.length));});
    root.querySelectorAll('[data-track]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.track)===state.track)));
    root.querySelectorAll('[data-library]').forEach(el=>el.hidden=!state.libraryOpen);
    root.querySelectorAll('[data-action="library"]').forEach(button=>{
      button.setAttribute('aria-expanded',String(state.libraryOpen));
      const label=button.querySelector('[data-library-label]'),symbol=button.querySelector('[data-library-symbol]');
      if(label){label.textContent=state.libraryOpen?'CLOSE TRACKS // 04':'LOCAL TRACKS // 04';symbol.textContent=state.libraryOpen?'−':'+';}
      else button.textContent=state.libraryOpen?'CLOSE TRACKS':'TRACKS';
    });
  }
  function selectTrack(index,announce=true) {
    state.track=(index+tracks.length)%tracks.length;state.position=0;renderArt(true);render();settleMatrix();
    if(announce)say(pad(state.track+1)+' // '+tracks[state.track].title);
  }
  function stopClock() { if(interval!==null){clearInterval(interval);interval=null;} }
  function syncClock() {
    stopClock();
    if(!state.playing||document.hidden||!inView||!root.isConnected)return;
    lastTick=performance.now();interval=setInterval(()=>{
      if(!root.isConnected){stopClock();return;}
      const now=performance.now();state.position+=Math.min(1.5,(now-lastTick)/1000);lastTick=now;
      if(state.position>=tracks[state.track].length)selectTrack(state.track+1);else render();
    },250);
  }
  function selectDesign(letter) {
    if(!names[letter])return;
    state.design=letter;root.dataset.buttonStyle=letter;
    root.querySelectorAll('[data-select]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.select===letter)));
    root.querySelector('[data-design-name]').textContent=names[letter];say(names[letter]+' selected');
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!root.contains(button))return;
    if(button.dataset.select){selectDesign(button.dataset.select);return;}
    if(button.dataset.track!==undefined){selectTrack(Number(button.dataset.track));return;}
    const action=button.dataset.action;
    if(action==='play'){state.playing=!state.playing;render();syncClock();say(state.playing?'Sample playback playing. No audio.':'Sample playback paused.');}
    else if(action==='next'||action==='prev'){selectTrack(state.track+(action==='next'?1:-1));syncClock();}
    else if(action==='library'){
      state.libraryOpen=!state.libraryOpen;render();say(state.libraryOpen?'Local tracks opened':'Local tracks closed');
    }
  });
  root.addEventListener('input',event=>{if(event.target.matches('[data-seek]')){state.position=Math.max(0,Math.min(tracks[state.track].length,Number(event.target.value)));lastTick=performance.now();render();}});
  root.addEventListener('change',event=>{if(event.target.matches('[data-seek]'))say('Position '+time(state.position));});
  document.addEventListener('visibilitychange',()=>{syncClock();if(document.hidden){cancelAnimationFrame(matrixFrame);matrixFrame=0;oldCells=[];clearHover();}});
  reduced.addEventListener('change',()=>{cancelAnimationFrame(matrixFrame);matrixFrame=0;oldCells=[];clearHover();});
  if(globalThis.IntersectionObserver){const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncClock();if(!inView){cancelAnimationFrame(matrixFrame);matrixFrame=0;oldCells=[];clearHover();}},{threshold:0});observer.observe(root);}
  renderLibraries();renderArt();render();selectDesign('brackets');announcement.textContent='';
  if(globalThis.Tweak){const tweak=new Tweak({container:root,onChange:()=>{renderArt();render();}});tweak.addSlider(design,'glyphContrast',{label:'Matrix contrast',min:.8,max:1.5,step:.05});tweak.addToggle(design,'grid',{label:'Fine background grid'});}
})();


window.XLR8Archive.finish({"select": [{"selector": "button[data-select=\"brackets\"]"}], "remove": ["button[data-select]"], "controls": false});
