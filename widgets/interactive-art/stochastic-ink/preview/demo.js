// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('stochastic-ink');
    const $ = key => root.querySelector('[data-' + key + ']');
    const canvas = $('stage'), ctx = canvas.getContext('2d');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const engine = createArtEngine();
    const bindings = new Map(), appearance = { paper: '#f6f5f2', ink: '#16151a', detail: 'Fine', compact: false };
    let W = 0, H = 0, ratio = 1, last = null, raf = 0, visible = true, captured = false, syncTime = 0;

    function makeControl(c) {
        let el, box, valueLabel, nameLabel;

        if (c.type === 'button') {
            el = box = document.createElement('button');
            el.type = 'button';
            el.addEventListener('click', () => act(c.key));
            $('actions').appendChild(box);
        }
        else {
            box = document.createElement('label');
            const head = document.createElement('span');
            nameLabel = document.createElement('span');
            valueLabel = document.createElement('output');
            head.append(nameLabel, valueLabel);
            el = document.createElement(c.type === 'select' ? 'select' : 'input');

            if (c.type === 'range') {
                el.type = 'range';
                el.min = c.min;
                el.max = c.max;
                el.step = c.step || 1;
            }

            box.append(head, el);
            el.addEventListener(c.type === 'range' ? 'input' : 'change', () => act(c.key, el.value));
            $('controls').appendChild(box);
        }

        bindings.set(c.key, { el, valueLabel, nameLabel, type: c.type, options: '' });
    }

    function syncControls() {
        engine.controls().forEach(c => {
            if (!bindings.has(c.key))
                makeControl(c);

            const b = bindings.get(c.key);

            if (c.type === 'button') {
                b.el.textContent = c.label;

                return;
            }

            b.nameLabel.textContent = c.label;
            b.el.setAttribute('aria-label', c.label);

            if (c.type === 'select') {
                const signature = JSON.stringify(c.options);

                if (signature !== b.options) {
                    b.el.replaceChildren(...c.options.map(option => {
                        const el = document.createElement('option');
                        el.value = option.value;
                        el.textContent = option.label;

                        return el;
                    }));

                    b.options = signature;
                }
            }

            // Leave a control alone while it is being dragged or edited.
            if (document.activeElement !== b.el || c.type === 'select')
                b.el.value = String(c.value);

            b.valueLabel.textContent = c.type === 'range' ? String(c.value) : '';
        });
    }

    function report() {
        const message = engine.status();

        if ($('status').textContent !== message)
            $('status').textContent = message;
    }

    function draw(elapsed) {
        if (!W || !H)
            return;

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        engine.render(ctx, W, H, elapsed);
    }

    function act(key, value) {
        engine.action(key, value);
        syncControls();
        report();
        draw(0);
    }

    function run(now) {
        raf = 0;

        if (last !== null && now - last < 1000 / 30) {
            schedule();

            return;
        }

        const elapsed = last === null ? 0 : (now - last) / 1000;
        last = now;
        draw(elapsed);
        report();

        if (now - syncTime > 250) {
            syncControls();
            syncTime = now;
        }

        schedule();
    }

    function schedule() {
        if (!engine.paused && visible && !document.hidden && !raf)
            raf = requestAnimationFrame(run);
    }

    function stop() {
        if (raf)
            cancelAnimationFrame(raf);

        raf = 0;
        last = null;
        engine.suspend();
    }

    function setPaused(value, message) {
        engine.setPaused(value);
        $('pause').textContent = value ? 'PLAY' : 'PAUSE';
        $('pause').setAttribute('aria-label', value ? 'Play animation' : 'Pause animation');
        $('pause').setAttribute('aria-pressed', String(value));

        if (value)
            stop();
        else
            schedule();

        if (message)
            $('status').textContent = message;
    }

    $('pause').addEventListener('click', () => setPaused(!engine.paused, engine.paused ? 'Animation playing.' : 'Animation paused. Controls still redraw the ink.'));

    function pointer(kind, e) {
        const r = canvas.getBoundingClientRect();
        engine.pointer(kind, e.clientX - r.left, e.clientY - r.top, e.timeStamp);

        if (kind !== 'move' || captured) {
            report();

            if (engine.paused)
                draw(0);
        }
    }

    canvas.addEventListener('pointerdown', e => {
        captured = true;
        canvas.focus({ preventScroll: true });
        canvas.setPointerCapture(e.pointerId);
        pointer('down', e);
    });

    canvas.addEventListener('pointermove', e => pointer('move', e));
    canvas.addEventListener('pointerup', e => {
        captured = false;
        pointer('up', e);
    });

    canvas.addEventListener('pointercancel', e => {
        captured = false;
        pointer('cancel', e);
    });

    canvas.addEventListener('pointerleave', e => {
        if (!captured)
            pointer('leave', e);
    });

    canvas.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape'].includes(e.key))
            return;

        e.preventDefault();
        engine.key(e.key);
        report();
        draw(0);
    });

    function resize() {
        const r = canvas.getBoundingClientRect();
        W = Math.max(1, r.width);
        H = Math.max(1, r.height);
        ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * ratio);
        canvas.height = Math.round(H * ratio);
        draw(0);
    }

    function visibility() {
        if (document.hidden || !visible)
            stop();
        else
            schedule();
    }

    function rgba(hex, alpha) {
        const n = parseInt(hex.slice(1), 16);

        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }

    function applyAppearance() {
        const style = root.style;
        style.setProperty('--paper', appearance.paper);
        style.setProperty('--ink', appearance.ink);
        style.setProperty('--dim', rgba(appearance.ink, .6));
        style.setProperty('--line', rgba(appearance.ink, .16));
        style.setProperty('--wash', rgba(appearance.ink, .04));
        document.body.style.setProperty('--paper', appearance.paper);
        canvas.style.height = appearance.compact ? '340px' : '';
        engine.configure({ paper: appearance.paper, ink: appearance.ink, detail: appearance.detail });
        resize();
    }

    document.addEventListener('visibilitychange', visibility);

    if (window.IntersectionObserver)
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            visibility();
        }).observe(root);

    if (window.ResizeObserver)
        new ResizeObserver(resize).observe(canvas);
    else
        window.addEventListener('resize', resize);

    media.addEventListener('change', () => {
        if (media.matches)
            setPaused(true, 'Reduced motion: still image. Press Play to animate.');
    });

    $('hint').textContent = engine.meta.hint;
    syncControls();
    applyAppearance();
    setPaused(media.matches, media.matches ? 'Reduced motion: still image. Press Play to animate.' : '');
    report();

    if (media.matches)
        $('status').textContent = 'Reduced motion: still image. Press Play to animate.';

    window.ChaldeaPreview.connect(settings => {
        for (const key of Object.keys(appearance))
            if (settings[key] !== undefined)
                appearance[key] = settings[key];

        applyAppearance();
    });
})();
