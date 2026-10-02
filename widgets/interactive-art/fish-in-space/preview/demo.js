// SPDX-License-Identifier: 0BSD
(() => {
  const root = document.getElementById('tsugumori-organic-lab');
  const $ = key => root.querySelector('[data-' + key + ']');
  const canvas = $('scene'), ctx = canvas.getContext('2d');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const design = { trails: true, detail: 1 };
  const school = XLR8FishMotion.createSchool(800, 414);
  let width = 0, height = 0, paused = media.matches, visible = true, raf = 0, last = null, cue = null;
  const say = text => { $('status').textContent = text; };

  function drawSpaceFish(ctx, width, height, school, options) {
    const t = school.time;
    const detail = options.detail;
    const unit = school.unit, TAU = Math.PI * 2;
    const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    ctx.save();
    ctx.fillStyle = '#050607';
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < Math.round(76 * detail); i++) {
      const x = rand(i + 2) * width, y = rand(i + 192) * height;
      ctx.fillStyle = `rgba(195,204,211,${.055 + rand(i + 64) * .22})`;
      const r = .35 + rand(i + 710) * .6;
      ctx.fillRect(x, y, r, r);
    }
    if (options.trails) for (const fish of school.fish) for (const point of fish.trail) {
      const life = 1 - (t - point.time) / 1.2;
      ctx.fillStyle = `rgba(208,221,222,${.16 * life * life})`;
      ctx.beginPath(); ctx.arc(point.x, point.y, .65 * life, 0, TAU); ctx.fill();
    }
    function fish(state) {
      const index = state.index, stroke = state.phase;
      const centerX = state.x, centerY = state.y;
      // The head is at u=0; the trailing fins extend along positive local X.
      const heading = state.heading + Math.PI;
      const roll = .32 + .16 * Math.sin(t * .17 + index * 2.6);
      const pitch = .09 * Math.sin(t * .17 + index * 2.5);
      const size = unit * state.scale * school.bodyFit;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const ch = Math.cos(heading), sh = Math.sin(heading);
      const spine = XLR8FishMotion.createSpine(state);
      function radius(u) {
        return (.032 + .265 * Math.pow(Math.sin(Math.PI * Math.min(1, u / .99)), 1.35)) * (1 - u * .55);
      }
      function project(u, y = 0, z = 0) {
        const p = spine(u), eps = .002, next = spine(u + eps);
        const bend = Math.atan2(next[1] - p[1], next[0] - p[0]);
        const localRoll = roll + .14 * Math.sin(u * 5.4 - stroke);
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
        ctx.strokeStyle = `rgba(224,231,232,${Math.min(1, opacity * 2)})`;
        ctx.fillStyle = `rgba(235,239,237,${Math.min(1, opacity * 3)})`;
        ctx.lineWidth = lineWidth * Math.max(.95, unit / 550);
        if (!dotted) {
          ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
          ctx.stroke();
        }
        ctx.beginPath();
        for (let i = 0; i < points.length; i += dotted ? 1 : 3) {
          const p = points[i], r = (dotted ? 1 : .8) * Math.max(.8, unit / 550) * p[2];
          ctx.moveTo(p[0] + r / 2, p[1]); ctx.arc(p[0], p[1], r / 2, 0, TAU);
        }
        ctx.fill();
      }
      // Every rib follows the local tangent and rolls along the flexing spine.
      for (let rib = 0; rib < Math.round(65 * detail); rib++) {
        const u = .035 + rib / Math.round(65 * detail) * .89, r = radius(u);
        const points = [];
        for (let k = 0; k <= 30; k++) {
          const a = k / 30 * TAU;
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
        for (let k = 0; k <= 80; k++) {
          const u = .018 + k / 80 * .955, r = radius(u);
          points.push(project(u, Math.cos(a) * r, Math.sin(a) * r * .64));
        }
        curve(points, rail === 0 ? .42 : .13, rail === 0 ? .72 : .42, rail % 2 === 0);
      }
      // Long, separate fin filaments form an airy sail above and below the body.
      for (let side of [-1, 1]) for (let j = 0; j < Math.round(33 * detail); j++) {
        const u = .2 + j / Math.round(33 * detail) * .61, r = radius(u), points = [];
        const finPhase = u * 5.4 - stroke + side * .45;
        const sail = Math.sin((u - .2) / .61 * Math.PI) * (.25 + .065 * Math.sin(finPhase));
        for (let k = 0; k <= 16; k++) {
          const v = k / 16, flutter = Math.sin(finPhase - v * 1.8) * v * v;
          points.push(project(u + v * .125 + flutter * .014, side * (r + v * sail + flutter * .018),
            .045 * Math.sin(v * Math.PI) + flutter * .06));
        }
        curve(points, .15 + .13 * Math.sin(u * Math.PI), .45, j % 3 !== 0);
      }
      // Forked tail rays open, fold, and twist together with the swimming stroke.
      for (let ray = 0; ray < Math.round(39 * detail); ray++) {
        const a = ray / Math.max(1, Math.round(39 * detail) - 1) * 2 - 1, points = [];
        for (let k = 0; k <= 24; k++) {
          const v = k / 24, fork = .2 + Math.abs(a) * .18;
          points.push(project(.925 + v * fork, a * v * .37,
            Math.sin(stroke - v * 2) * v * .07));
        }
        curve(points, .13 + Math.abs(a) * .2, .48, ray % 4 !== 0);
      }
      for (let side of [-1, 1]) {
        for (let j = 0; j < 10; j++) {
          const points = [];
          for (let k = 0; k <= 24; k++) {
            const v = k / 24;
            points.push(project(.23 + v * (.18 + j * .009), side * (radius(.23) + Math.sin(v * Math.PI / 2) * (.15 + j * .011)), Math.sin(v * 3 - stroke) * .02));
          }
          curve(points, .15, .42, true);
        }
      }
      curve(Array.from({ length: 125 }, (_, k) => project(k / 124)), .63, .65);
    }
    for (const state of school.fish) fish(state);
    ctx.restore();
  }
  function draw() {
    if (!width || !height) return;
    drawSpaceFish(ctx, width, height, school, design);
    if (cue) {
      const age = school.time - cue.time;
      if (age >= .8) { cue = null; return; }
      ctx.strokeStyle = `rgba(208,221,222,${.3 * (1 - age / .8)})`;
      ctx.lineWidth = .8;
      ctx.beginPath(); ctx.arc(cue.x, cue.y, 5 + age * 12, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function run(now) {
    raf = 0;
    const dt = last === null ? 0 : Math.min((now - last) / 1000, .05);
    last = now;
    school.step(dt);
    draw(); schedule();
  }
  function schedule() {
    if (!paused && visible && !document.hidden && !raf) raf = requestAnimationFrame(run);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = null;
  }
  function syncPause() {
    $('pause').textContent = paused ? 'PLAY' : 'PAUSE';
    $('pause').setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
  }
  function syncGather() {
    $('gather').textContent = school.gathered ? 'RELEASE' : 'GATHER';
    $('gather').setAttribute('aria-pressed', String(school.gathered));
  }
  function attract(x, y) {
    school.attract(x, y);
    cue = { x, y, time: school.time };
    syncGather(); draw(); schedule();
    say(paused ? 'Destination set. Press Play to swim there.' : 'A quick dart, then swimming toward the click.');
  }
  $('pause').addEventListener('click', () => {
    paused = !paused; syncPause();
    if (paused) stop(); else schedule();
    say(paused ? 'Animation paused.' : 'Animation playing.');
  });
  $('gather').addEventListener('click', () => {
    school.setGathered(!school.gathered); syncGather();
    say(school.gathered ? 'The pair draw together.' : 'The pair swim freely.');
    draw(); schedule();
  });
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    attract((event.clientX - rect.left) * width / rect.width, (event.clientY - rect.top) * height / rect.height);
  });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); attract(width * .5, height * .5);
    }
  });
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    school.resize(width, height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cue = null; draw();
  }
  function visibility() {
    if (document.hidden || !visible) stop(); else schedule();
  }
  document.addEventListener('visibilitychange', visibility);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visibility(); });
  intersection.observe(canvas);
  const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(canvas);
  media.addEventListener('change', () => {
    if (media.matches) { paused = true; stop(); syncPause(); say('Reduced motion: animation paused.'); }
  });
  resize(); syncPause(); syncGather();
  say(paused ? 'Reduced motion: still preview. Press Play to animate.' : 'Two fish, swimming independently.');
  schedule();
  const disconnect = window.XLR8Preview.connect(settings => { Object.assign(design, settings); draw(); });
  window.addEventListener('pagehide', () => { stop(); intersection.disconnect(); sizeObserver.disconnect(); disconnect(); });
})();
