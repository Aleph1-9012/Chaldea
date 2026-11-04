(() => {
  'use strict';

  const canvas = document.getElementById('school');
  const context = canvas.getContext('2d');
  const preview = window.ChaldeaPreview;
  const hosted = window.parent !== window;
  document.documentElement.toggleAttribute('data-hosted', hosted);

  if (hosted) delete document.body.dataset.previewWidth;

  const scene = create();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let visible = false;
  let speed = 1;
  let lastTime = 0;
  let request = 0;

  function artworkFrame(width, height) {
    const fittedWidth = Math.min(width, 360, height * 40 / 53);
    const fittedHeight = fittedWidth * 53 / 40;

    return { x: (width - fittedWidth) / 2, y: (height - fittedHeight) / 2, width: fittedWidth, height: fittedHeight };
  }

  function paint() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();

    if (!width || !height) return;

    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }

    context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    context.fillStyle = '#030303';
    context.fillRect(0, 0, width, height);
    const frame = artworkFrame(width, height);
    context.translate(frame.x, frame.y);
    draw(context, scene, frame.width, frame.height);
  }

  function tick(now) {
    request = 0;

    if (paused || !visible || document.hidden) return;
    if (lastTime && now - lastTime < 1000 / 30) {
      request = requestAnimationFrame(tick);

      return;
    }

    if (lastTime) advance(scene, (now - lastTime) / 1000, speed);

    lastTime = now;
    paint();
    request = requestAnimationFrame(tick);
  }

  function schedule() {
    cancelAnimationFrame(request);
    request = 0;
    lastTime = 0;

    if (!paused && visible && !document.hidden) request = requestAnimationFrame(tick);

    preview?.controlsChanged();
  }

  function restart() {
    reset(scene);
    paint();
  }

  function pointFrom(event) {
    const box = canvas.getBoundingClientRect();
    const frame = artworkFrame(box.width, box.height);
    setPointer(scene, (event.clientX - box.left - frame.x) / frame.width, (event.clientY - box.top - frame.y) / frame.height, true);
  }

  canvas.addEventListener('pointermove', pointFrom);
  canvas.addEventListener('pointerleave', () => setPointer(scene, .5, .5, false));
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;

    event.preventDefault();
    canvas.dataset.pointerFocus = '';
    canvas.focus({ preventScroll: true });
    pointFrom(event);
  });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') setPointer(scene, .5, .5, false);
  });
  canvas.addEventListener('pointercancel', () => setPointer(scene, .5, .5, false));
  canvas.addEventListener('blur', () => { delete canvas.dataset.pointerFocus; });
  canvas.addEventListener('keydown', event => {
    delete canvas.dataset.pointerFocus;

    if (event.code === 'Space') {
      event.preventDefault();
      paused = !paused;
      schedule();
    }

    if (event.key.toLowerCase() === 'r') restart();
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
    paused = motion.matches;
    schedule();
  });
  new ResizeObserver(paint).observe(canvas);
  preview?.connect(settings => {
    speed = settings.speed;
    paint();
  }, {
    read() {
      return {
        controls: [{ type: 'button', key: 'restart', label: 'Restart' }],
        archives: [],
        status: 'Move across the school to part the fish. Space pauses; R restarts.',
        paused,
        canEscape: false,
      };
    },
    pause(value) { paused = value; schedule(); },
    action(key) { if (key === 'restart') restart(); },
    hosted() {},
  });
  paint();
  schedule();
})();
