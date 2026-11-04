(() => {
  'use strict';

  const canvas = document.getElementById('sea');
  const preview = window.ChaldeaPreview;
  const query = new URLSearchParams(location.search);
  const frozen = query.has('still') || query.has('phase');
  const hosted = window.parent !== window;
  document.documentElement.toggleAttribute('data-hosted', hosted);

  if (hosted) delete document.body.dataset.previewWidth;

  const sea = window.SeaTurtle.create(canvas, hosted);
  const { turtle } = sea;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headings = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  let paused = motion.matches || frozen || !sea.animated;
  let visible = false;
  let speed = 1;
  let request = 0;
  let lastTime = 0;
  let press = null;

  function tick(now) {
    request = 0;

    if (paused || !visible || document.hidden) return;

    if (lastTime) sea.advance(Math.min((now - lastTime) / 1000, .05) * speed);

    lastTime = now;
    sea.paint();
    request = requestAnimationFrame(tick);
  }

  function schedule() {
    cancelAnimationFrame(request);
    request = 0;
    lastTime = 0;

    if (!paused && visible && !document.hidden) request = requestAnimationFrame(tick);

    preview?.controlsChanged();
  }

  function recenter() {
    sea.recenter();
    sea.paint();
  }

  function pointFrom(event) {
    const box = canvas.getBoundingClientRect();

    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function release(event) {
    if (!press || press.id !== event.pointerId) return;

    const point = pointFrom(event);
    turtle.held = false;
    canvas.removeAttribute('data-held');

    if (event.type === 'pointerup' && !press.moved) {
      if (press.onTurtle) {
        sea.dart();
      } else if (paused) {
        turtle.x = point.x;
        turtle.y = point.y;
        sea.paint();
      } else {
        sea.call(point.x, point.y);
      }
    } else if (press.onTurtle) {
      // Let go after a drag: carry the throw, then pick a new line.
      turtle.speed = Math.min(Math.hypot(press.velocityX, press.velocityY) * .35, sea.bodyPixels() * .8);
      turtle.goal = null;
    }

    press = null;
  }

  if (frozen) sea.freeze(query.has('phase') ? Number(query.get('phase')) : null);

  // A touch that starts on the turtle drags it; anywhere else the page can still scroll.
  canvas.addEventListener('touchstart', event => {
    const box = canvas.getBoundingClientRect();
    const touch = event.touches[0];

    if (sea.hit(touch.clientX - box.left, touch.clientY - box.top)) event.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;

    event.preventDefault();
    const point = pointFrom(event);
    const onTurtle = sea.hit(point.x, point.y);
    press = { id: event.pointerId, x: point.x, y: point.y, offsetX: turtle.x - point.x, offsetY: turtle.y - point.y, onTurtle, moved: false, velocityX: 0, velocityY: 0, time: event.timeStamp };
    turtle.held = onTurtle;
    canvas.dataset.pointerFocus = '';
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    canvas.toggleAttribute('data-held', onTurtle);
  });
  canvas.addEventListener('pointermove', event => {
    if (!event.isPrimary) return;

    const point = pointFrom(event);
    canvas.toggleAttribute('data-over', sea.hit(point.x, point.y));

    if (!press || press.id !== event.pointerId) return;

    if (Math.hypot(point.x - press.x, point.y - press.y) > 6) press.moved = true;

    if (press.onTurtle && press.moved) {
      const elapsed = Math.max((event.timeStamp - press.time) / 1000, .001);
      const nextX = point.x + press.offsetX;
      const nextY = point.y + press.offsetY;
      const blend = 1 - Math.exp(-18 * elapsed);
      press.velocityX += ((nextX - turtle.x) / elapsed - press.velocityX) * blend;
      press.velocityY += ((nextY - turtle.y) / elapsed - press.velocityY) * blend;
      press.time = event.timeStamp;
      turtle.x = nextX;
      turtle.y = nextY;

      if (paused) sea.paint();
    }
  });
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => canvas.removeAttribute('data-over'));
  canvas.addEventListener('blur', () => { delete canvas.dataset.pointerFocus; });
  window.addEventListener('keydown', event => {
    delete canvas.dataset.pointerFocus;

    if (event.code === 'Space') {
      event.preventDefault();

      if (!event.repeat && sea.animated && !frozen) {
        paused = !paused;
        schedule();
      }
    } else if (Object.hasOwn(headings, event.key)) {
      event.preventDefault();
      const [x, y] = headings[event.key];
      sea.call(turtle.x + x * sea.bodyPixels(), turtle.y + y * sea.bodyPixels());
    } else if (event.key.toLowerCase() === 'r') {
      recenter();
    }
  });
  document.addEventListener('visibilitychange', schedule);
  const intersection = new IntersectionObserver(entries => {
    const next = entries.some(entry => entry.isIntersecting);

    if (visible === next) return;

    visible = next;
    schedule();
  });
  intersection.observe(canvas);
  motion.addEventListener('change', () => {
    paused = motion.matches || frozen || !sea.animated;
    schedule();
  });
  const resizes = new ResizeObserver(([entry]) => {
    sea.layout(entry.devicePixelContentBoxSize?.[0]);
    sea.paint();
  });

  try {
    resizes.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    resizes.observe(canvas);
  }

  preview?.connect(settings => {
    speed = settings.speed;
    sea.configure(settings.size, settings.background);
    document.documentElement.style.background = settings.background === 'White' ? '#fff' : '#fefbf4';
    sea.paint();
  }, {
    read() {
      return {
        controls: [{ type: 'button', key: 'recenter', label: 'Recenter' }],
        archives: [],
        status: 'Click a spot to call the turtle. Drag it to move it, or tap it to make it dart. Space pauses; arrow keys steer; R recenters.',
        paused,
        canEscape: false,
      };
    },
    pause(value) {
      paused = value || !sea.animated || frozen;
      schedule();
    },
    action(key) { if (key === 'recenter') recenter(); },
    hosted() {},
  });
  sea.paint();
  schedule();
})();
