// SPDX-License-Identifier: 0BSD
(() => {
  const root = document.getElementById('ts-glyph-five-studies');
  if (!root) return;
  const screen = root.querySelector('.tr-screen');
  const canvas = root.querySelector('.tr-art');
  const context = canvas.getContext('2d');
  const pass = root.querySelector('#tr-study-pass');
  const status = root.querySelector('.tr-status');
  const unlock = root.querySelector('.tr-unlock');
  const state = { motion:true, duration:100, red:100 };
  const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const design = 'o';
  let count = 0, phase = 0, motion = null, frame = null;
  let composing = false, compositionEcho = false, previewTimer = null;
  const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const smooth = v => { const t=clamp(v); return t*t*(3-2*t); };
  // A two-dimensional integer hash avoids the old modulo formula's repeated rows.
  function hash(x,y,seed=0) {
    let n = Math.imul(x+1,374761393) ^ Math.imul(y+1,668265263) ^ Math.imul(seed+1,1442695041);
    n = Math.imul(n ^ (n>>>13),1274126177);
    return ((n ^ (n>>>16))>>>0) / 4294967296;
  }
  const ink = {black:'#090909'};
  function colour(t) {
    t=clamp(t*state.red/100);
    const a=[104,102,94], b=[209,22,28];
    return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;
  }
  // Each study is a pure function of input length, never of the typed characters.
  // A lower phase recreates the same earlier geometry, including during reversal.
  // Q: Oblique ligatures. Diagonal stems fold and trade short branches.
  // R: Radical exchange. Paired angular fragments slide through shared joints.
  // All geometry is a pure function of input length, so deletion retraces it.
  function extraArt(kind, p, api) {
    const { hash, clamp, smooth, lerp, colour } = api;
    const marks = [];
    const path = (points, red = 0, alpha = 1, w = 1) => {
      marks.push({ type: 'path', points, c: colour(red), w, alpha });
    };
    const blend = (a, b, t) => a.map((point, i) => [
      lerp(point[0], b[i][0], t), lerp(point[1], b[i][1], t)
    ]);
    const project = (points, cx, cy, angle = 0) => {
      const co = Math.cos(angle), si = Math.sin(angle);
      return points.map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]);
    };
    const strength = (x, y, seed, offset = 0) => {
      const rank = hash(x, y, seed) * 67;
      return smooth(clamp((p + offset + 3 - rank) / 4));
    };

    if (kind === 'q') {
      const stage = Math.floor(p / 2);
      const fraction = smooth(p / 2 - stage);
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const cx = 18 + col * 24, cy = 18 + row * 24;
          const orient = Math.floor(hash(col, row, 417) * 4) * Math.PI / 2;
          const frame = step => {
            const side = hash(col + step * 13, row, 409) > 0.5 ? 1 : -1;
            const bend = lerp(-2.5, 2.5, hash(col, row + step * 7, 433));
            const upper = lerp(4, 8, hash(col + step, row, 449));
            const lower = lerp(4, 8, hash(col, row + step, 463));
            return [
              [[-7, 10], [-4, 3], [2 + bend, -2], [6, -10]],
              [[-4, 3], [-9, 3 - side * lower * 0.6], [-10, -side * lower]],
              [[2 + bend, -2], [9, -2 - side * upper * 0.55], [10, -side * upper]],
              [[-6, 8], [-1, 8], [2, 4 + bend]],
              [[2, -7], [-3, -7], [-5, -3 + bend]],
              [[-10, 8], [-8, 4]],
              [[8, -7], [10, -11]]
            ];
          };
          const a = frame(stage), b = frame(stage + 1);
          for (let j = 0; j < a.length; j++) {
            const red = strength(col, row, 479 + j * 29, j === 0 ? 8 : 0);
            const points = project(blend(a[j], b[j], fraction), cx, cy, orient);
            path(points, red, j > 4 ? 0.45 : j === 0 ? 0.95 : 0.69);
          }
          // Sparse joints link neighbouring figures without creating long rules.
          if (col < 9 && hash(col, row, 541) > 0.67) {
            const y = cy + lerp(-6, 6, hash(col, row, 547));
            path([[cx + 10, y], [cx + 12, y - 2], [cx + 14, y - 2]],
              strength(col, row, 557, 5), 0.48);
          }
        }
      }
    }

    if (kind === 'r') {
      const stage = Math.floor(p / 2.5);
      const fraction = smooth(p / 2.5 - stage);
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const cx = 18 + col * 36, cy = 18 + row * 36;
          const orient = hash(col, row, 613) > 0.5 ? Math.PI / 2 : 0;
          const frame = step => {
            const close = hash(col + step * 3, row, 617);
            const shuttle = lerp(-4, 4, hash(col, row + step * 11, 619));
            const upper = lerp(-3, 3, hash(col + step * 17, row, 631));
            const gap = lerp(1.5, 5.5, close);
            return [
              [[-14, -12], [-8, -12], [-8, -3 + upper], [-gap, -3 + upper]],
              [[14, 12], [8, 12], [8, 3 - upper], [gap, 3 - upper]],
              [[-14, 7], [-11, 7], [-11, 13], [-3, 13]],
              [[14, -7], [11, -7], [11, -13], [3, -13]],
              [[-5, -13], [-5, -8], [3 + shuttle, -8]],
              [[5, 13], [5, 8], [-3 + shuttle, 8]],
              [[-14, -6], [-12, -6], [-12, 2 + shuttle]],
              [[14, 6], [12, 6], [12, -2 + shuttle]],
              [[-gap, -6], [-gap, 6], [gap, 6]],
              [[gap, 3], [gap, -3], [gap + 3, -6]],
              [[-5, 3 + shuttle], [-9, 3 + shuttle]],
              [[5, -3 + shuttle], [9, -3 + shuttle]],
              [[-1 + shuttle, -14], [3 + shuttle, -14]],
              [[1 - shuttle, 14], [-3 - shuttle, 14]]
            ];
          };
          const a = frame(stage), b = frame(stage + 1);
          for (let j = 0; j < a.length; j++) {
            const red = strength(col, row, 641 + Math.floor(j / 2) * 31,
              j === 8 || j === 9 ? 10 : 0);
            const points = project(blend(a[j], b[j], fraction), cx, cy, orient);
            path(points, red, j >= 12 ? 0.5 : j === 8 || j === 9 ? 0.96 : 0.71);
          }
          if (row < 6 && hash(col, row, 857) > 0.57) {
            const shift = lerp(-7, 7, hash(col, row, 859));
            path([[cx + shift, cy + 15], [cx + shift, cy + 18], [cx + shift + 3, cy + 21]],
              strength(col, row, 863, 4), 0.47);
          }
        }
      }
    }
    return marks;
  }
  function makeArt(kind,p) {
    const marks=[];
    const path=(points,c=ink.grey,w=1,alpha=1)=>marks.push({type:'path',points,c,w,alpha});
    const transform=(points,cx,cy,angle)=>points.map(([x,y])=>[cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)]);
    if(kind==='n') {
      function relay(cx,cy,s,a,c,w,alpha=1) {
        const h=s/2,b=s*.31;
        path(transform([[-h,0],[-b,0],[-b,-b],[0,-b],[0,-h]],cx,cy,a),c,w,alpha);
        path(transform([[0,h],[0,b],[b,b],[b,0],[h,0]],cx,cy,a),c,w,alpha);
      }
      for(let y=0;y<6;y++)for(let x=0;x<6;x++) {
        const key=y*6+x,cx=26+x*40,cy=26+y*40,bank=(key*3)%8;
        const turn=Math.floor(p/8)+smooth(clamp(p%8-bank));
        const angle=(Math.floor(hash(x,y,4)*4)+turn)*Math.PI/2;
        const tint=smooth((p*.012+.25-hash(x,y,23))/.2);
        relay(cx,cy,40,angle,colour(tint),1.1);
        for(let side=0;side<4;side++)path(transform([[0,-12.4],[0,-8.3]],cx,cy,side*Math.PI/2),colour(tint),.7,.75);
        const inner=(Math.floor(hash(x,y,9)*4)-turn)*Math.PI/2;
        if(hash(x,y,11)>.38) {
          relay(cx,cy,16.6,inner,colour(tint*.7+.18),.85);
          relay(cx,cy,7,-inner,colour(tint),.65,.82);
        } else {
          for(let q=0;q<4;q++)relay(cx+(q%2?4.15:-4.15),cy+(q<2?-4.15:4.15),8.3,inner+q*Math.PI/2,colour(tint),.7,.86);
        }
      }
    } else if(kind==='o') {
      function branch(cx,cy,size,depth,key) {
        const alpha=depth<3?1:smooth((p+6-hash(key,depth,31)*20)/5);
        const hx=size*.24*(1+.07*Math.sin(p*.37+key*.4));
        const hy=size*.24*(1+.07*Math.cos(p*.33+key*.6));
        const angle=depth===0?0:Math.floor(hash(key,depth,8)*2)*Math.PI/2;
        const tint=smooth((p*.011+.19-hash(key,depth,18))/.2);
        if(alpha>.004) {
          const c=colour(tint),w=depth===0?1.05:depth===1?.85:.65;
          path(transform([[-hx,0],[hx,0]],cx,cy,angle),c,w,alpha);
          path(transform([[-hx,-hy],[-hx,hy]],cx,cy,angle),c,w,alpha);
          path(transform([[hx,-hy],[hx,hy]],cx,cy,angle),c,w,alpha);
          if(depth>=3)path(transform([[-hx,hy*.35],[0,hy*.35],[0,hy*.8]],cx,cy,angle),c,.65,alpha*.75);
        }
        if(depth<3)for(let child=0;child<4;child++) {
          const points=transform([[(child%2?1:-1)*hx,(child<2?-1:1)*hy]],cx,cy,angle);
          const childKey=key*4+child+1;
          const ratio=.4+.1*smooth((1+Math.sin(p*.19+hash(childKey,depth,9)*6.28))/2);
          branch(points[0][0],points[0][1],size*ratio,depth+1,childKey);
        }
      }
      for(let y=0;y<3;y++)for(let x=0;x<3;x++)branch(46+x*80,46+y*80,80,0,y*3+x+1);
    } else if(kind==='p') {
      const forms=[
        [[-5,-6],[-5,5],[4,5]],[[4,-6],[4,1],[-5,1],[-5,6]],
        [[-5,5],[5,-5],[5,2]], [[-5,-4],[5,-4],[5,5],[-2,5]],
        [[-5,-6],[0,-6],[0,6],[5,6]], [[-5,0],[5,0],[5,-5]],
        [[-4,-6],[-4,5],[5,-4]], [[-5,-5],[0,0],[-5,5],[5,5]]
      ];
      function clippedLine(a,b,c,w) {
        const dx=b[0]-a[0],dy=b[1]-a[1];let lo=0,hi=1;
        for(const [v,q] of [[-dx,a[0]-4],[dx,248-a[0]],[-dy,a[1]-4],[dy,248-a[1]]]) {
          if(Math.abs(v)<1e-9){if(q<0)return;continue;}
          const r=q/v;if(v<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);
        }
        if(lo<=hi)path([[a[0]+lo*dx,a[1]+lo*dy],[a[0]+hi*dx,a[1]+hi*dy]],c,w);
      }
      for(let col=0;col<14;col++) {
        const speed=(col%2?1:-1)*(4.5+(col%3)*2.25),offset=p*speed;
        const begin=Math.floor(-offset/18)-1;
        for(let row=begin;row<begin+17;row++) {
          const cx=9+col*18,cy=9+row*18+offset;
          const index=Math.floor(hash(col,row,7)*forms.length);
          const angle=Math.floor(hash(col,row,8)*4)*Math.PI/2;
          const tint=smooth((p*.01+.2-hash(col,row,16))/.2),c=colour(tint);
          const points=transform(forms[index],cx,cy,angle);
          for(let i=0;i<points.length-1;i++)clippedLine(points[i],points[i+1],c,1.05);
          const small=transform([[-5,-6],[-2,-6]],cx,cy,angle+Math.PI/2);
          clippedLine(small[0],small[1],c,.75);
        }
      }
    } else if(kind==='q'||kind==='r') {
      return extraArt(kind,p,{hash,clamp,smooth,lerp,colour,transform});
    }
    return marks;
  }
  function draw() {
    if (!context) return;
    context.setTransform(2,0,0,2,0,0);
    context.clearRect(0,0,252,252);
    context.fillStyle=ink.black; context.fillRect(0,0,252,252);
    context.save(); context.beginPath(); context.rect(0,0,252,252); context.clip();
    context.lineCap='butt'; context.lineJoin='miter';
    for(const m of makeArt(design,phase)) {
      context.globalAlpha=m.alpha; context.strokeStyle=m.c;
      context.beginPath(); m.points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
      context.lineWidth=m.w; context.stroke();
    }
    context.restore(); context.globalAlpha=1;
  }
  function sample(now) {
    if (!motion) return 1;
    const t=clamp((now-motion.started)/motion.duration);
    phase=t===1?motion.to:lerp(motion.from,motion.to,1-Math.pow(1-t,3));
    return t;
  }
  function tick(now) {
    frame=null;
    if (!root.isConnected) { motion=null; return; }
    const done=sample(now)===1; draw();
    if(done) motion=null; else frame=requestAnimationFrame(tick);
  }
  function animate() {
    sample(performance.now());
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null; motion=null;
    if(!state.motion || preference?.matches || Math.abs(phase-count)<.00001) { phase=count; draw(); return; }
    motion={from:phase,to:count,started:performance.now(),duration:Math.min(700,state.duration*Math.max(1,Math.sqrt(Math.abs(count-phase))))};
    frame=requestAnimationFrame(tick);
  }
  function restStatus() { status.textContent=count?'READY TO UNLOCK':'TYPE TO ACTIVATE'; }
  function endPreview() { if(previewTimer!==null) clearTimeout(previewTimer); previewTimer=null; delete screen.dataset.unlock; }
  function consumeInput() {
    const length=Math.min(pass.value.length,64);
    const start=Math.min(pass.selectionStart??length,length), end=Math.min(pass.selectionEnd??start,length);
    // Replace entered characters immediately. No storage, password-derived seed or network.
    pass.value='x'.repeat(length); pass.setSelectionRange(start,end);
    const changed=length!==count; count=length;
    endPreview(); if(changed) animate(); restStatus();
  }
  pass.addEventListener('compositionstart',()=>{composing=true;compositionEcho=false;});
  pass.addEventListener('compositionend',()=>{composing=false;consumeInput();compositionEcho=true;});
  pass.addEventListener('input',event=>{
    if(composing || event.isComposing) return;
    if(compositionEcho) { compositionEcho=false; if(event.inputType==='insertCompositionText'||event.inputType==='insertFromComposition') return; }
    consumeInput();
  });
  pass.addEventListener('keydown',event=>{
    if(event.key==='Enter' && !event.isComposing && !composing) {event.preventDefault();unlock.click();}
  });
  unlock.addEventListener('click',()=>{
    if(!count) {status.textContent='ENTER DUMMY TEXT FIRST'; pass.focus(); return;}
    endPreview(); screen.dataset.unlock='true'; status.textContent='PREVIEW ONLY';
    previewTimer=setTimeout(()=>{delete screen.dataset.unlock;previewTimer=null;restStatus();},1100);
  });
  function render() {
    screen.dataset.motion=state.motion&&!preference?.matches?'on':'off';
    animate();
  }
  preference?.addEventListener?.('change',render);
  render();
  // First render does not depend on the optional design-control helper.
  window.XLR8Preview.connect(settings => { Object.assign(state, settings); render(); });
})();
