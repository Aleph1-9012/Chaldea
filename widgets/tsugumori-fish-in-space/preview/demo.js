// SPDX-License-Identifier: 0BSD
(() => {
  const root=document.getElementById('tsugumori-organic-lab');
  const $=key=>root.querySelector('[data-'+key+']');
  const canvas=$('scene'),ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const design={trails:true,detail:1};
  let width=0,height=0,clock=3.1,paused=media.matches,visible=true,raf=0,last=null;
  let pointer=null,gather=false,gatherAmount=0,fresh=true;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const say=s=>$('status').textContent=s;
function drawSpaceFish(ctx, width, height, timeSeconds, options = {}) {
  const t = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const detail = Math.max(.35, Math.min(1.5, options.detail || 1));
  const gather = Math.max(0, Math.min(1, options.gather || 0));
  const unit = Math.min(width * .92, height * .78), TAU = Math.PI * 2;
  const target = options.target || { x: .5, y: .5 };
  const cx = width * (.5 + (target.x - .5) * .11);
  const cy = height * (.53 + (target.y - .5) * .08);
  const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  ctx.save();
  ctx.fillStyle = options.trails ? 'rgba(5,6,7,.25)' : '#050607';
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < Math.round(76 * detail); i++) {
    const x = rand(i + 2) * width, y = (rand(i + 192) * height + t * (1 + rand(i + 8))) % height;
    ctx.fillStyle = `rgba(195,204,211,${.055 + rand(i + 64) * .22})`;
    const r = .35 + rand(i + 710) * .6;
    ctx.fillRect(x, y, r, r);
  }
  function fish(index) {
    const phase = t * .25 + index * Math.PI;
    const centerX = cx + Math.cos(phase + .3) * unit * (.205 - gather * .065);
    const centerY = cy + Math.sin(phase + .3) * unit * (.115 - gather * .04);
    const heading = phase + Math.PI * .52;
    const roll = .55 * Math.sin(t * .37 + index * 2.6) + .32;
    const pitch = .28 * Math.sin(t * .22 + index * 2.5);
    const size = unit * (.192 + .012 * Math.sin(phase));
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ch = Math.cos(heading), sh = Math.sin(heading);
    function spine(u) {
      return [(u - .47) * 2.8,
        .3 * Math.sin(u * 5.8 - t * 1.2 + index) * (.2 + u) + .24 * Math.sin(u * 3.9),
        .17 * Math.sin(u * 7 - t * .9 + index * 2) * u];
    }
    function radius(u) {
      return (.032 + .265 * Math.pow(Math.sin(Math.PI * Math.min(1, u / .99)), 1.35)) * (1 - u * .55);
    }
    function project(u, y = 0, z = 0) {
      const p = spine(u), eps = .002, next = spine(u + eps);
      const bend = Math.atan2(next[1] - p[1], next[0] - p[0]);
      const localRoll = roll + .48 * Math.sin(u * 6 - t * .8 + index);
      const yy = y * Math.cos(localRoll) - z * Math.sin(localRoll);
      const zz = y * Math.sin(localRoll) + z * Math.cos(localRoll);
      const x = p[0] - yy * Math.sin(bend), v = p[1] + yy * Math.cos(bend);
      const depth = (p[2] + zz) * cp + x * sp;
      const xx = x * cp - (p[2] + zz) * sp;
      const perspective = 4.7 / (4.7 + depth);
      return [centerX + (xx * ch - v * sh) * size * perspective,
        centerY + (xx * sh + v * ch) * size * perspective, perspective];
    }
    function curve(points, opacity, lineWidth = .6, dotted = false) {
      if (!points.length) return;
      ctx.strokeStyle = `rgba(224,231,232,${Math.min(1, opacity * 1.65)})`;
      ctx.fillStyle = `rgba(235,239,237,${Math.min(1, opacity * 2.1)})`;
      ctx.lineWidth = lineWidth * Math.max(.95, unit / 550);
      if (!dotted) {
        ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
        ctx.stroke();
      }
      for (let i = 0; i < points.length; i += dotted ? 1 : 3) {
        const p = points[i], r = (dotted ? .82 : .65) * Math.max(.8, unit / 550) * p[2];
        ctx.fillRect(p[0] - r / 2, p[1] - r / 2, r, r);
      }
    }
    // Every rib follows the local tangent and rolls along the flexing spine.
    for (let rib = 0; rib < Math.round(65 * detail); rib++) {
      const u = .035 + rib / Math.round(65 * detail) * .89, r = radius(u);
      const points = [];
      for (let k = 0; k <= 42; k++) {
        const a = k / 42 * TAU;
        points.push(project(u + .034 * Math.sin(a) ** 2, Math.cos(a) * r, Math.sin(a) * r * .64));
      }
      curve(points, .12 + .23 * Math.sin(Math.PI * u), .46, rib % 3 !== 0);
      if (rib % 2 === 0) {
        const p = project(u), q = project(u, -.018, .008);
        curve([p, q], .7, .85);
      }
    }
    for (let rail = 0; rail < 7; rail++) {
      const a = rail / 7 * TAU, points = [];
      for (let k = 0; k <= 105; k++) {
        const u = .018 + k / 105 * .955, r = radius(u);
        points.push(project(u, Math.cos(a) * r, Math.sin(a) * r * .64));
      }
      curve(points, rail === 0 ? .42 : .13, rail === 0 ? .72 : .42, rail % 2 === 0);
    }
    // Long, separate fin filaments form an airy sail above and below the body.
    for (let side of [-1, 1]) for (let j = 0; j < Math.round(33 * detail); j++) {
      const u = .2 + j / Math.round(33 * detail) * .61, r = radius(u), points = [];
      const sail = Math.sin((u - .2) / .61 * Math.PI) * (.22 + .12 * Math.sin(u * 13 - t));
      for (let k = 0; k <= 22; k++) {
        const v = k / 22, flutter = Math.sin(v * 7 + u * 13 - t * 1.7) * v * v;
        points.push(project(u + v * .125 + flutter * .017, side * (r + v * sail),
          .045 * Math.sin(v * Math.PI) + flutter * .07));
      }
      curve(points, .15 + .13 * Math.sin(u * Math.PI), .45, j % 3 !== 0);
    }
    // Forked tail rays open, fold, and twist together with the swimming stroke.
    for (let ray = 0; ray < Math.round(39 * detail); ray++) {
      const a = ray / Math.max(1, Math.round(39 * detail) - 1) * 2 - 1, points = [];
      for (let k = 0; k <= 32; k++) {
        const v = k / 32, fork = .2 + Math.abs(a) * .18;
        points.push(project(.925 + v * fork, a * v * .37,
          Math.sin(t * 1.25 - v * 3 + index) * v * .12));
      }
      curve(points, .13 + Math.abs(a) * .2, .48, ray % 4 !== 0);
    }
    for (let side of [-1, 1]) {
      for (let j = 0; j < 10; j++) {
        const points = [];
        for (let k = 0; k <= 24; k++) {
          const v = k / 24;
          points.push(project(.23 + v * (.18 + j * .009), side * (radius(.23) + Math.sin(v * Math.PI / 2) * (.15 + j * .011)), Math.sin(v * 3 + t) * .08));
        }
        curve(points, .15, .42, true);
      }
    }
    curve(Array.from({ length: 125 }, (_, k) => project(k / 124)), .63, .65);
  }
  fish(Math.sin(t * .25) > 0 ? 1 : 0);
  fish(Math.sin(t * .25) > 0 ? 0 : 1);
  ctx.restore();
}
  function draw() {
    if(!width||!height)return;
    if(fresh||!design.trails||paused){ctx.clearRect(0,0,width,height);ctx.fillStyle='#080808';ctx.fillRect(0,0,width,height);}
    fresh=false;
    drawSpaceFish(ctx,width,height,clock,{target:pointer,gather:gatherAmount,trails:design.trails,detail:design.detail});
  }
  function update(dt) {
    clock+=dt;
    gatherAmount+=(Number(gather)-gatherAmount)*Math.min(1,dt*2.1);
  }
  function run(now) {
    raf=0;if(last!==null&&now-last<1000/30){schedule();return;}const dt=last===null?0:Math.min((now-last)/1000,.08);last=now;update(dt);draw();schedule();
  }
  function schedule() {if(!paused&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(run);}
  function stop() {if(raf)cancelAnimationFrame(raf);raf=0;last=null;}
  function syncPause(){ $('pause').textContent=paused?'PLAY':'PAUSE';$('pause').setAttribute('aria-label',paused?'Play animation':'Pause animation'); }
  function actionPose() {
    if(paused)gatherAmount=Number(gather);
    draw();schedule();
  }
  function initializeScene() {
    pointer=null;fresh=true;
    $('title').textContent='DRIFT';$('number').textContent='01';
    $('id').textContent='NO. 704';
    $('hint').textContent='Move through the space to draw them closer.';
    canvas.setAttribute('aria-label','Two skeletal point-cloud fish moving through black space. Pointer movement and Gather bring them closer.');
    canvas.style.touchAction='pan-y';
    say(gather?'Fish gathered.':'Two fish, drifting freely.');draw();
  }
  $('pause').addEventListener('click',()=>{paused=!paused;syncPause();if(paused)stop();else schedule();say(paused?'Animation paused.':'Animation playing.');});
  $('gather').addEventListener('click',()=>{gather=!gather;$('gather').textContent=gather?'RELEASE':'GATHER';$('gather').setAttribute('aria-pressed',String(gather));say(gather?'The pair draw together.':'The pair drift apart.');actionPose();});
  function position(e) {const r=canvas.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/width,0,1),y:clamp((e.clientY-r.top)/height,0,1)};}
  canvas.addEventListener('pointermove',e=>{pointer=position(e);if(paused)actionPose();});
  canvas.addEventListener('pointerdown',e=>{
    pointer=position(e);
    actionPose();
  });
  canvas.addEventListener('pointerleave',()=>{pointer=null;if(paused)draw();});
  function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);fresh=true;draw();}
  function visibility(){if(document.hidden||!visible)stop();else schedule();}
  document.addEventListener('visibilitychange',visibility);
  if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visibility();}).observe(root);
  if(window.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  media.addEventListener('change',()=>{if(media.matches){paused=true;stop();syncPause();say('Reduced motion: animation paused.');}});
  resize();initializeScene();syncPause();if(paused)say('Reduced motion: still preview. Press Play to animate.');schedule();
  if(document.fonts)document.fonts.ready.then(draw);
  window.XLR8Preview.connect(settings => { Object.assign(design, settings); fresh = true; draw(); });
})();
