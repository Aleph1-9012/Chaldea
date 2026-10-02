// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('tsugumori-organic-lab');
    const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), engine = createArtEngine();
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1, height = 1, last = 0, frame = 0, visible = true;
    engine.setPaused(preference.matches);
    function sync() {
        const gather = engine.controls()[0];
        root.querySelector('[data-gather]').textContent = gather.label;
        root.querySelector('[data-gather]').setAttribute('aria-pressed', String(gather.pressed));
        const pause = root.querySelector('[data-pause]');
        pause.textContent = engine.paused ? 'PLAY' : 'PAUSE';
        pause.setAttribute('aria-label', engine.paused ? 'Play animation' : 'Pause animation');
        root.querySelector('[data-status]').textContent = engine.status();
    }

    function draw(dt = 0) {
        engine.render(ctx, width, height, dt);
    }

    function schedule() {
        if (!frame && visible && !document.hidden && !engine.paused)
            frame = requestAnimationFrame(tick);
    }

    function tick(now) {
        frame = 0;
        const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
        last = now;
        draw(dt);
        schedule();
    }

    function stop() {
        if (frame)
            cancelAnimationFrame(frame);

        frame = 0;
        last = 0;
    }

    root.querySelector('[data-gather]').addEventListener('click', () => {
        engine.action('gather');
        sync();
        draw();
        schedule();
    });

    root.querySelector('[data-pause]').addEventListener('click', () => {
        engine.setPaused(!engine.paused);

        if (engine.paused)
            stop();

        sync();
        draw();
        schedule();
    });

    canvas.addEventListener('click', event => {
        const r = canvas.getBoundingClientRect();
        engine.pointer('click', event.clientX - r.left, event.clientY - r.top);
        sync();
        draw();
        schedule();
    });

    canvas.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            engine.key('activate');
            sync();
            draw();
            schedule();
        }
    });

    function resize() {
        const r = canvas.getBoundingClientRect();
        width = Math.max(1, r.width);
        height = Math.max(1, r.height);
        const dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;

        if (!visible)
            stop();
        else
            schedule();
    });

    intersection.observe(canvas);
    function visibility() {
        if (document.hidden)
            stop();
        else
            schedule();
    }

    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', () => {
        if (preference.matches) {
            engine.setPaused(true);
            stop();
            sync();
        }
    });

    resize();
    sync();
    schedule();
    const disconnect = window.ChaldeaPreview.connect(settings => {
        engine.configure(settings);
        draw();
    });

    window.addEventListener('pagehide', () => {
        stop();
        sizeObserver.disconnect();
        intersection.disconnect();
        disconnect();
        document.removeEventListener('visibilitychange', visibility);
    });
})();
