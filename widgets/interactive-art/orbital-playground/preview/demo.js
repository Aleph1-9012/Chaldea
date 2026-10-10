// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('ts-play-lab');
    const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
    const engine = createArtEngine();
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const standaloneLabel = canvas.getAttribute('aria-label'), standaloneText = canvas.textContent;
    let width = 1, height = 1, last = 0, frame = 0, visible = true;
    let hostedControls = false;
    engine.setPaused(preference.matches);

    function sync() {
        root.querySelector('[data-title]').textContent = engine.meta.title;
        root.querySelector('[data-gesture]').textContent = engine.meta.hint;
        root.querySelector('[data-status]').textContent = engine.status();

        if (hostedControls)
            canvas.setAttribute('aria-label', engine.meta.title + '. ' + engine.meta.hint + ' Controls are beside the artwork.');

        const pause = root.querySelector('[data-action="motion"]');
        pause.textContent = engine.paused ? 'Resume motion' : 'Pause motion';
        pause.setAttribute('aria-pressed', String(engine.paused));

        for (const control of engine.controls()) {
            const [group, name] = control.key.split(':');
            const element = group === 'input' ? root.querySelector(`[data-input="${name}"]`) : root.querySelector(`[data-action="${control.key}"]`);

            if (!element)
                continue;

            if (control.type === 'button') {
                element.textContent = control.label;
                element.hidden = !!control.hidden;
                element.disabled = !!control.disabled;

                if ('pressed' in control)
                    element.setAttribute('aria-pressed', String(control.pressed));
            }
            else {
                if (element.value !== String(control.value))
                    element.value = String(control.value);

                if (control.outputKey)
                    root.querySelector(`[data-output="${control.outputKey}"]`).textContent = control.output;
            }
        }

        window.ChaldeaPreview.controlsChanged();
    }

    function draw(dt = 0) {
        engine.render(ctx, width, height, dt);
    }

    function schedule() {
        if (!frame && visible && !document.hidden && !engine.paused && engine.needsMotion())
            frame = requestAnimationFrame(tick);
    }

    function tick(now) {
        frame = 0;
        const dt = last ? Math.min(.04, (now - last) / 1000) : 0;
        last = now;
        draw(dt);
        schedule();
    }

    function stop() {
        if (frame)
            cancelAnimationFrame(frame);

        frame = 0;
        last = 0;
        engine.suspend();
        window.ChaldeaPreview.controlsChanged();
    }

    function redraw() {
        if (visible && !document.hidden && !engine.paused)
            schedule();
        else
            draw();
    }

    function act(key, value) {
        engine.action(key, value);

        if (key === 'motion' && engine.paused)
            stop();

        sync();
        redraw();
    }

    root.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => act(el.dataset.action)));
    root.querySelectorAll('[data-input]').forEach(el => el.addEventListener('input', () => act('input:' + el.dataset.input, el.value)));

    function point(kind, event) {
        const r = canvas.getBoundingClientRect();
        engine.pointer(kind, event.clientX - r.left, event.clientY - r.top, event.timeStamp);
        sync();
        redraw();
    }

    canvas.addEventListener('pointermove', e => {
        if (canvas.hasPointerCapture(e.pointerId))
            point('move', e);
    });

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== 0)
            return;

        canvas.setPointerCapture(e.pointerId);
        point('down', e);
    });

    function release(e) {
        point('up', e);

        if (canvas.hasPointerCapture(e.pointerId))
            canvas.releasePointerCapture(e.pointerId);
    }

    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.tabIndex = 0;

    function resize() {
        const r = canvas.getBoundingClientRect();
        width = Math.max(1, r.width);
        height = Math.max(80, r.height);
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
        else {
            last = 0;
            schedule();
        }
    });

    intersection.observe(root);
    function visibility() {
        if (document.hidden)
            stop();
        else {
            last = 0;
            schedule();
        }
    }

    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', () => {
        if (preference.matches) {
            engine.setPaused(true);
            stop();
            sync();
            draw();
        }
    });

    resize();
    sync();
    schedule();

    if (!preference.matches)
        root.querySelector('.ts-shutter').animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 390, easing: 'cubic-bezier(.16,1,.3,1)' });

    const disconnect = window.ChaldeaPreview.connect(settings => {
        engine.configure(settings);
        root.style.setProperty('--ts-red', settings.accent);
        sync();
        redraw();
    }, {
        read() {
            return { controls: engine.controls(), archives: engine.archives(), status: engine.status(), paused: engine.paused };
        },
        action: act,
        pause(value) {
            engine.setPaused(value);

            if (engine.paused)
                stop();

            sync();
            redraw();
        },
        hosted(active) {
            root.classList.toggle('is-hosted', active);
            hostedControls = active;
            root.querySelectorAll('.ts-mast, .ts-scene-heading, .ts-gesture, .ts-controls, .ts-status, .ts-foot').forEach(element => {
                element.hidden = active;
            });
            canvas.setAttribute('aria-label', active ? engine.meta.title + '. ' + engine.meta.hint + ' Controls are beside the artwork.' : standaloneLabel);
            canvas.textContent = active ? 'Interactive artwork. Use the controls beside the artwork to change it.' : standaloneText;
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
