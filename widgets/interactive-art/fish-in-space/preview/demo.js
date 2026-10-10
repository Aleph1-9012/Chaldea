// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('tsugumori-organic-lab');
    const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), engine = createArtEngine();
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const standaloneLabel = canvas.getAttribute('aria-label'), standaloneText = canvas.textContent;
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
        window.ChaldeaPreview.controlsChanged();
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

    function act(key) {
        engine.action(key);
        sync();
        draw();
        schedule();
    }

    function pause(value) {
        engine.setPaused(value);

        if (engine.paused)
            stop();

        sync();
        draw();
        schedule();
    }

    root.querySelector('[data-gather]').addEventListener('click', () => act('gather'));
    root.querySelector('[data-pause]').addEventListener('click', () => pause(!engine.paused));

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
        sync();
    }, {
        read() {
            return { controls: engine.controls(), archives: [], status: engine.status(), paused: engine.paused };
        },
        action: act,
        pause,
        hosted(active) {
            root.classList.toggle('is-hosted', active);
            root.querySelectorAll('.org-name, .org-footer, .org-caption, .org-hint').forEach(element => {
                element.hidden = active;
            });
            canvas.setAttribute('aria-label', active ? standaloneLabel + ' Controls are beside the artwork.' : standaloneLabel);
            canvas.textContent = active ? 'Animated artwork. Controls beside the artwork provide alternatives to pointer interaction.' : standaloneText;
        },
    });

    window.addEventListener('pagehide', () => {
        stop();
        sizeObserver.disconnect();
        intersection.disconnect();
        disconnect();
        document.removeEventListener('visibilitychange', visibility);
    });
})();
