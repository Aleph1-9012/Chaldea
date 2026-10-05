// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('tsugumori-eight-studies');
    const $ = key => root.querySelector('[data-' + key + ']');
    const canvas = $('stage'), ctx = canvas.getContext('2d');
    const standaloneText = canvas.textContent;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const study = makeMagnetic();
    const title = "MAGNETIC POWDER";
    const hint = "Drag a pole across the plate. Flip polarity or add a third magnet.";
    let W = 0, H = 0, time = 0, syncTime = 0, last = null, raf = 0, paused = media.matches, visible = true, captured = false;
    const bindings = new Map(), appearance = { compact: false };
    function makeControl(c) {
        let el, box, valueLabel, nameLabel;

        if (c.type === 'button') {
            el = document.createElement('button');
            el.type = 'button';
            box = el;
            el.addEventListener('click', () => act(c.key));
        }
        else {
            box = document.createElement('label');
            const label = document.createElement('span');
            nameLabel = document.createElement('span');
            nameLabel.textContent = c.label;
            label.appendChild(nameLabel);
            valueLabel = document.createElement('output');
            label.appendChild(valueLabel);
            box.appendChild(label);
            el = document.createElement(c.type === 'select' ? 'select' : 'input');

            if (c.type === 'range') {
                el.type = 'range';
                el.min = c.min;
                el.max = c.max;
                el.step = c.step || 1;
            }

            el.setAttribute('aria-label', c.label);
            box.appendChild(el);
            el.addEventListener(c.type === 'range' ? 'input' : 'change', () => act(c.key, el.value));
        }

        $('controls').appendChild(box);
        bindings.set(c.key, { el, box, valueLabel, nameLabel, type: c.type, options: '' });
    }

    function syncControls() {
        const controls = study.controls();
        const keys = new Set(controls.map(c => c.key));

        for (const [key, b] of bindings) {
            if (!keys.has(key)) {
                b.box.remove();
                bindings.delete(key);
            }
        }

        controls.forEach(c => {
            if (!bindings.has(c.key))
                makeControl(c);

            const b = bindings.get(c.key);

            if (c.type === 'button') {
                b.el.textContent = c.label;

                if (c.pressed !== undefined)
                    b.el.setAttribute('aria-pressed', String(c.pressed));
                else
                    b.el.removeAttribute('aria-pressed');
            }
            else {
                b.nameLabel.textContent = c.label;
                b.el.setAttribute('aria-label', c.label);

                if (c.type === 'select') {
                    const signature = JSON.stringify(c.options);

                    if (signature !== b.options) {
                        b.el.replaceChildren();
                        c.options.forEach(option => {
                            const el = document.createElement('option');
                            el.value = option.value;
                            el.textContent = option.label;
                            b.el.appendChild(el);
                        });

                        b.options = signature;
                    }
                }

                b.el.value = String(c.value);
                b.valueLabel.textContent = c.type === 'range' ? String(c.value) : '';
            }

            b.el.disabled = Boolean(c.disabled);
        });

        window.ChaldeaPreview.controlsChanged();
    }

    function report() {
        const message = study.status();

        if (message && $('status').textContent !== message)
            $('status').textContent = message;

        window.ChaldeaPreview.controlsChanged();
    }

    function act(key, value) {
        study.action(key, value);

        if (paused) {
            study.update(.033, time);
        }

        syncControls();
        report();
        draw();
        schedule();
    }

    function draw() {
        if (!W || !H)
            return;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        study.draw(ctx, W, H, time);
        ctx.restore();
    }

    function run(now) {
        raf = 0;

        if (last !== null && now - last < 1000 / 30) {
            schedule();

            return;
        }

        const dt = last === null ? 0 : Math.min((now - last) / 1000, .06);
        last = now;
        time += dt;
        study.update(dt, time);
        draw();
        report();

        if (time - syncTime > .2) {
            syncControls();
            syncTime = time;
        }

        schedule();
    }

    function schedule() {
        if (!paused && visible && !document.hidden && !raf)
            raf = requestAnimationFrame(run);
    }

    function stop() {
        if (raf)
            cancelAnimationFrame(raf);

        raf = 0;
        last = null;
        study.suspend?.();

        if (bindings.size)
            syncControls();
    }

    function initializeScene() {
        captured = false;
        $('title').textContent = title;
        $('hint').textContent = hint;
        canvas.setAttribute('aria-label', title + '. ' + hint + ' Controls are below.');
        syncControls();
        report();
        draw();
        schedule();
    }

    function pauseLabel() {
        $('pause').textContent = paused ? 'PLAY' : 'PAUSE';
        $('pause').setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    }

    function setPaused(value) {
        paused = value;
        pauseLabel();

        if (paused)
            stop();
        else
            schedule();

        syncControls();
        $('status').textContent = paused ? 'Animation paused.' : 'Animation playing.';
        window.ChaldeaPreview.controlsChanged();
    }

    $('pause').addEventListener('click', () => setPaused(!paused));

    function pos(e) {
        const r = canvas.getBoundingClientRect();

        return [Math.max(0, Math.min(1, (e.clientX - r.left) / W)), Math.max(0, Math.min(1, (e.clientY - r.top) / H))];
    }

    function pointer(kind, e) {
        const p = pos(e);
        study.pointer?.(kind, ...p);

        if (paused && kind === 'move')
            study.update(.033, time);

        if (kind !== 'move' || captured)
            syncControls();

        if (kind === 'up' || kind === 'down')
            report();

        draw();
    }

    canvas.addEventListener('pointerdown', e => {
        captured = true;
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
        pointer('up', e);
    });

    canvas.addEventListener('pointerleave', e => {
        if (!captured)
            pointer('leave', e);
    });

    function resize() {
        const r = canvas.getBoundingClientRect();
        W = Math.max(1, r.width);
        H = Math.max(1, r.height);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * ratio);
        canvas.height = Math.round(H * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        draw();
    }

    function visibility() {
        if (document.hidden || !visible)
            stop();
        else
            schedule();
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
        if (media.matches) {
            paused = true;
            stop();
            pauseLabel();
            syncControls();
            $('status').textContent = 'Reduced motion: still preview. Press Play to animate.';
            window.ChaldeaPreview.controlsChanged();
        }
    });

    resize();
    initializeScene();
    pauseLabel();

    if (paused)
        $('status').textContent = 'Reduced motion: still preview. Press Play to animate.';

    if (document.fonts)
        document.fonts.ready.then(draw);

    window.ChaldeaPreview.connect(settings => {
        Object.assign(appearance, settings);
        canvas.style.height = appearance.compact ? '320px' : '';
        resize();
        window.ChaldeaPreview.controlsChanged();
    }, {
        read() {
            return { controls: study.controls(), archives: [], status: $('status').textContent, paused };
        },
        action: act,
        pause: setPaused,
        hosted(active) {
            root.querySelectorAll('.eight-brand, .eight-controls, .eight-footer').forEach(element => {
                element.hidden = active;
            });
            canvas.setAttribute('aria-label', title + '. ' + hint + (active ? ' Controls are beside the artwork.' : ' Controls are below.'));
            canvas.textContent = active ? 'Interactive art. All main actions have controls beside the artwork.' : standaloneText;
        },
    });
})();
