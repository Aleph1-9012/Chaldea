// SPDX-License-Identifier: 0BSD
// Original simulation and drawing rules, shared by browser and QML hosts.
function createArtEngine() {
    let ctx;
    const bone = a => `rgba(232,232,232,${a})`;
    const TAU = Math.PI * 2, clamp = (n, a, b) => Math.max(a, Math.min(b, n)), mix = (a, b, t) => a + (b - a) * t;
    const noise = n => {
        const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;

        return v - Math.floor(v);
    };

    const design = { grid: true, density: 'Fine', accent: '#cc1515' };
    const state = { mode: 5, paused: false, time: 0, visible: true, dirty: true, w: 700, h: 380, pointer: { x: 0, y: 0, inside: false, down: false }, forms: [], signals: [], fossils: [] };
    const specimen = { motion: .55, response: 1, freeze: null, ripples: [], offsetX: 0, offsetY: 0 };
    const orbit = { selected: 2, bodies: Array.from({ length: 5 }, (_, i) => ({ phase: i * 1.24, r: .4 + i * .125, speed: (i % 2 ? -1 : 1) * (.15 + i * .028), spin: 0 })), hits: [], drag: null };
    const resonance = { playing: false, energy: 0, beat: 'drift', intensity: .7, clock: 0 };
    const targets = [[28, 64, 76], [72, 35, 58], [46, 82, 31]], discoveries = ['Scout vessel', 'Ribbed wanderer', 'The broken crown'];
    const signal = { index: 0, values: [50, 50, 50], locked: false };
    const gravity = { strength: .65, count: 700, center: false, second: false, particles: [], burst: 0 };
    const sessions = [
        { name: 'Quiet engine', seed: 1, bins: [.18, .2, .38, .83, .9, .89, .8, .42, .2], detail: 'Sample · 142 minutes · 3 projects · 8 switches' },
        { name: 'Branching hours', seed: 4, bins: [.2, .83, .27, .96, .2, .86, .36, .88, .1], detail: 'Sample · 98 minutes · 6 projects · 31 switches' },
        { name: 'After midnight', seed: 8, bins: [.12, .18, .32, .36, .4, .61, .76, .51, .2], detail: 'Sample · 67 minutes · 2 projects · 5 switches' }
    ];

    const fossil = { session: 0, rotation: 25, name: sessions[0].name, drag: null };
    const names = ['Specimen chamber', 'Orbital playground', 'Resonance sculpture', 'Signal hunting', 'Gravity sandbox', 'Session fossils'];
    const gestures = ['Move to attract · Click to send a ripple', 'Drag a body, then let go · Click to select', 'Bass squeezes the ring · Percussion ripples the rim', 'Tune the three dials until the hidden shape resolves', 'Hold and drag to pull · Release to scatter · Esc clears wells', 'Drag to rotate · Name a shape and keep it'];
    const meta = { "style": "lab", "title": "Session fossils", "hint": "Move to attract \u00b7 Click to send a ripple", "brand": "TSUGUMORI // PLAY", "fields": 2 };
    const fields = [{ "key": "input:session", "type": "select", "label": "Sample session", "value": "0", "options": [{ "value": "0", "label": "Sep 06 \u00b7 long focus" }, { "value": "1", "label": "Sep 05 \u00b7 many detours" }, { "value": "2", "label": "Sep 04 \u00b7 late-night drift" }] }, { "key": "input:rotation", "type": "range", "label": "Rotation", "value": 25.0, "min": 0, "max": 360, "step": 1, "outputKey": "rotation" }, { "key": "input:fossil-name", "type": "text", "label": "Specimen name", "value": "Quiet engine", "maxLength": 32 }];
    const view = { buttons: { "motion": { "key": "motion", "type": "button", "label": "Pause motion", "disabled": false, "hidden": false, "pressed": false }, "archive-fossil": { "key": "archive-fossil", "type": "button", "label": "Archive fossil", "disabled": false, "hidden": false, "pressed": false } }, outputs: { "rotation": "25\u00b0" }, qualities: {}, archives: [], status: "", focus: "" };
    function dirty() {
        state.dirty = true;
    }

    function status(value) {
        view.status = value;
        dirty();
    }

    function output(key, value) {
        view.outputs[key] = String(value);
    }

    function button(key) {
        return view.buttons[key] || (view.buttons[key] = { key, type: 'button', label: key });
    }

    function field(key) {
        return fields.find(c => c.key === 'input:' + key);
    }

    function archiveChip(container, label, callback) {
        view.archives.push({ label, callback });
    }

    function ellipse(cx, cy, rx, ry, angle) {
        const k = .5522847498307936;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.moveTo(rx, 0);
        ctx.bezierCurveTo(rx, k * ry, k * rx, ry, 0, ry);
        ctx.bezierCurveTo(-k * rx, ry, -rx, k * ry, -rx, 0);
        ctx.bezierCurveTo(-rx, -k * ry, -k * rx, -ry, 0, -ry);
        ctx.bezierCurveTo(k * rx, -ry, rx, -k * ry, rx, 0);
        ctx.restore();
    }

    function accent(alpha = 1) {
        const c = design.accent;

        return `rgba(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)},${alpha})`;
    }

    function line(points, color, width = 1) {
        if (points.length < 2)
            return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++)
            ctx.lineTo(points[i].x, points[i].y);

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function dot(x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
    }

    function text(str, x, y, color = bone(.62), align = 'left', size = 11) {
        ctx.font = size + 'px "Share Tech Mono", monospace';
        ctx.textAlign = align;
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
    }

    function project(x, y, z, scale, angle = .4, tilt = .25, cx = state.w / 2, cy = state.h / 2 + 5) {
        const x1 = x * Math.cos(angle) + z * Math.sin(angle), z1 = -x * Math.sin(angle) + z * Math.cos(angle);
        const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt), z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
        const p = 4.8 / (4.8 + z2);

        return { x: cx + x1 * scale * p, y: cy + y1 * scale * p, z: z2, p };
    }

    function background() {
        const { w, h } = state;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        if (design.grid) {
            ctx.strokeStyle = accent(.1);
            ctx.lineWidth = .65;
            ctx.beginPath();

            for (let x = 0; x < w; x += 20) {
                ctx.moveTo(x + .5, 0);
                ctx.lineTo(x + .5, h);
            }

            for (let y = 0; y < h; y += 20) {
                ctx.moveTo(0, y + .5);
                ctx.lineTo(w, y + .5);
            }

            ctx.stroke();
        }

        ctx.strokeStyle = accent(.38);
        ctx.beginPath();
        const m = 16, l = 12;
        [[m, 36, 1, 1], [w - m, 36, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => {
            ctx.moveTo(x + sx * l, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + sy * l);
        });

        ctx.stroke();

        for (let i = 0; i < 9; i++) {
            const y = 58 + i * (h - 100) / 8;
            line([{ x: 8, y }, { x: i % 2 ? 11 : 14, y }], accent(.4));
        }
    }

    function makeParticles() {
        gravity.particles = Array.from({ length: gravity.count }, (_, i) => ({ x: noise(i * 5 + 10) * state.w, y: 36 + noise(i * 5 + 11) * (state.h - 60), vx: (noise(i * 5 + 12) - .5) * 24, vy: (noise(i * 5 + 13) - .5) * 24, history: [] }));
        dirty();
    }

    function burst(x, y, power = 90) {
        for (const p of gravity.particles) {
            const dx = p.x - x, dy = p.y - y, d = Math.max(15, Math.hypot(dx, dy));
            p.vx += dx / d * power;
            p.vy += dy / d * power;
        }

        gravity.burst = state.time;
        dirty();
    }

    function wells() {
        const all = [];

        if (state.pointer.down)
            all.push({ x: state.pointer.x, y: state.pointer.y });
        else if (gravity.center)
            all.push({ x: state.w * .5, y: state.h * .5 });

        if (gravity.second)
            all.push({ x: state.w * .73, y: state.h * .36 });

        return all;
    }

    function drawFossil() {
        const session = sessions[fossil.session], scale = Math.min(state.w * .29, state.h * .305), angle = fossil.rotation * Math.PI / 180, points = [], rings = design.density === 'Fine' ? 72 : 44;
        const vertical = [];

        for (let j = 0; j <= rings; j++) {
            const u = j / rings, bi = u * (session.bins.length - 1), activity = mix(session.bins[Math.floor(bi)], session.bins[Math.min(session.bins.length - 1, Math.floor(bi) + 1)], bi % 1), cap = Math.pow(Math.max(.0001, Math.sin(Math.PI * u)), .38), path = [];

            for (let k = 0; k <= 58; k++) {
                const a = k / 58 * TAU;
                const r = cap * (.28 + .37 * activity + .045 * Math.sin(7 * a + session.seed) + .035 * Math.sin(19 * u + 3 * a));
                let x = r * Math.cos(a) + .13 * Math.sin(5 * u + session.seed), y = 2.46 * (u - .5), z = .8 * r * Math.sin(a) + .1 * Math.sin(8 * u);

                if (fossil.session === 1) {
                    x += Math.sin(u * 11) * .18;
                    z += Math.cos(u * 14) * .16;
                }

                if (fossil.session === 2) {
                    x += u * u * .26;
                    y *= .94;
                }

                const p = project(x, y, z, scale, angle, .06, state.w / 2, state.h / 2 + 4);
                path.push(p);
                points.push(Object.assign(Object.assign({}, p), { red: j === Math.floor(rings * .48), edge: k % 6 === 0 }));

                if (k === 0)
                    vertical.push(p);
            }

            if (j % 2 === 0)
                line(path, j === Math.floor(rings * .48) ? accent(.8) : bone(.24), .65);
        }

        line(vertical, bone(.45), .7);
        points.sort((a, b) => b.z - a.z).forEach(p => dot(p.x, p.y, p.edge ? .95 : .6, p.red ? accent(.95) : bone(.3 + (p.p - .9) * .8)));
        const baseY = state.h - 35;
        ctx.strokeStyle = accent(.3);
        ctx.lineWidth = .7;
        ctx.beginPath();
        ellipse(state.w / 2, baseY, Math.min(83, state.w * .22), 12, 0);
        ctx.stroke();
        text('SAMPLE / SEP 0' + (6 - fossil.session), 26, state.h - 28, accent(.95));
        text(Math.round(fossil.rotation) + '°', state.w - 26, state.h - 28, bone(.6), 'right');
    }

    function needsMotion() {
        return [!specimen.freeze, true, resonance.playing || resonance.energy > .002, !signal.locked, true, false][state.mode];
    }

    function updateMotion() {
        button('motion').label = state.paused ? 'Resume motion' : 'Pause motion';
        button('motion').pressed = state.paused;
        dirty();
    }

    function updateOrbit() {
        const b = orbit.bodies[orbit.selected];
        field('workspace').value = String(orbit.selected);
        field('orbit').value = String(Math.round(b.r * 100));
        output('orbit', Math.round(b.r * 100) + '%');
        status('Preview workspace ' + String(orbit.selected + 1).padStart(2, '0') + ' selected. Your real workspaces stay unchanged.');
    }

    function updateSignal(announce = true) {
        signal.locked = signal.values.every((v, i) => Math.abs(v - targets[signal.index][i]) <= 5);
        signal.values.forEach((v, i) => {
            const diff = Math.abs(v - targets[signal.index][i]), quality = diff <= 5 ? 'matched' : diff <= 14 ? 'warm' : 'cold';
            output('tune' + i, v + ' · ' + quality);
            fields.find(c => c.key === 'tune:' + i).value = v;
            view.qualities[i] = 100 - Math.min(100, diff * 2);
        });

        button('assist').disabled = signal.locked;
        button('collect').disabled = !signal.locked || state.signals.includes(signal.index);
        button('collect').label = state.signals.includes(signal.index) ? 'Collected' : 'Collect discovery';

        if (announce)
            status(signal.locked ? discoveries[signal.index] + ' found. Collect it to keep a discovery card.' : 'Tune until every dial reads matched. Assist solves one dial.');

        dirty();
    }

    function holdForm(f) {
        specimen.freeze = f;
        specimen.motion = f.motion;
        specimen.ripples = f.ripples.slice();
        field('motion').value = f.motion * 100;
        output('motion', Math.round(f.motion * 100) + '%');
        button('release-form').hidden = false;
        button('save-form').disabled = true;
        status('Form ' + String(f.id).padStart(2, '0') + ' held. Kept in this preview only.');
    }

    function releaseForm() {
        specimen.freeze = null;
        specimen.ripples = [];
        button('release-form').hidden = true;
        button('save-form').disabled = state.forms.length >= 6;
        status('Specimen released. Move the pointer or send a ripple.');
        dirty();
    }

    function setFossil(sample, rotation, name) {
        fossil.session = sample;
        fossil.rotation = rotation;
        fossil.name = name;
        field('session').value = sample;
        field('rotation').value = rotation;
        field('fossil-name').value = name;
        output('rotation', Math.round(rotation) + '°');
        button('archive-fossil').disabled = false;
        status(sessions[sample].detail + ' · sample data only.');
    }

    function releaseWells() {
        const all = wells();
        state.pointer.down = false;
        gravity.center = false;
        gravity.second = false;

        for (const w of all)
            burst(w.x, w.y, 70);

        button('well').pressed = false;
        button('well').label = 'Hold center well';
        button('second-well').pressed = false;
        button('second-well').label = 'Add second well';
        status('Wells released. Particles are drifting.');
    }

    const actions = {
        motion() {
            state.paused = !state.paused;
            updateMotion();
            status(state.paused ? 'Motion paused. Controls still work.' : 'Motion resumed.');
        },
        ripple() {
            if (specimen.freeze)
                releaseForm();

            specimen.ripples.push(state.time);
            specimen.ripples = specimen.ripples.filter(t => state.time - t < 3);

            if (state.paused) {
                state.time += .7;
                dirty();
            }

            status('A ripple is travelling along the spine.');
        },
        'save-form'() {
            if (state.forms.length >= 6)
                return;

            const f = { id: state.forms.length + 1, time: state.time, ox: specimen.offsetX, oy: specimen.offsetY, motion: specimen.motion, ripples: specimen.ripples.slice() };
            state.forms.push(f);
            archiveChip('forms', 'Form ' + String(f.id).padStart(2, '0'), () => holdForm(f));
            holdForm(f);
        },
        'release-form': releaseForm,
        'orbit-impulse'() {
            orbit.bodies[orbit.selected].speed *= 1.65;

            if (Math.abs(orbit.bodies[orbit.selected].speed) > 1.2)
                orbit.bodies[orbit.selected].speed = Math.sign(orbit.bodies[orbit.selected].speed) * 1.2;

            orbit.bodies[orbit.selected].phase += .28;
            status('Impulse applied to preview workspace ' + String(orbit.selected + 1).padStart(2, '0') + '.');
            dirty();
        },
        'orbit-reverse'() {
            orbit.bodies[orbit.selected].speed *= -1;
            orbit.bodies[orbit.selected].phase += .08;
            status('Orbit direction reversed.');
            dirty();
        },
        music() {
            resonance.playing = !resonance.playing;

            if (resonance.playing && state.paused) {
                state.paused = false;
                updateMotion();
            }

            button('music').label = resonance.playing ? 'Pause demo beat' : 'Play demo beat';
            button('music').pressed = resonance.playing;
            status(resonance.playing ? 'Silent simulated beat playing. Bass compresses the ring; percussion sends ripples.' : 'Demo paused. The sculpture settles into a still ring.');
            dirty();
        },
        assist() {
            const i = signal.values.findIndex((v, j) => Math.abs(v - targets[signal.index][j]) > 5);

            if (i >= 0)
                signal.values[i] = targets[signal.index][i];

            updateSignal();
        },
        collect() {
            if (!signal.locked || state.signals.includes(signal.index))
                return;

            const i = signal.index;
            state.signals.push(i);
            archiveChip('signals', String(i + 1).padStart(2, '0') + '// ' + discoveries[i], () => {
                signal.index = i;
                signal.values = targets[i].slice();
                updateSignal();
                status(discoveries[i] + ' · collected in this preview.');
            });

            updateSignal(false);
            status(discoveries[i] + ' collected. Choose Next signal to search again.');
        },
        'next-signal'() {
            signal.index = (signal.index + 1) % targets.length;
            signal.values = [50, 50, 50];
            updateSignal();
        },
        well() {
            if (gravity.center) {
                gravity.center = false;
                burst(state.w / 2, state.h / 2);
            }
            else
                gravity.center = true;

            button('well').pressed = gravity.center;
            button('well').label = gravity.center ? 'Release + burst' : 'Hold center well';
            status(gravity.center ? 'Center well held. Release it to throw the particles outward.' : 'Center well released.');
            dirty();
        },
        'second-well'() {
            gravity.second = !gravity.second;
            button('second-well').pressed = gravity.second;
            button('second-well').label = gravity.second ? 'Remove second well' : 'Add second well';

            if (!gravity.second)
                burst(state.w * .73, state.h * .36, 60);

            status(gravity.second ? 'Second well added. The two fields compete.' : 'Second well removed.');
            dirty();
        },
        scatter() {
            releaseWells();
            burst(state.w / 2, state.h / 2, 160);
            status('Particles scattered. Hold anywhere to gather them again.');
        },
        'archive-fossil'() {
            const name = field('fossil-name').value.trim();

            if (!name) {
                status('Give the fossil a name first.');
                view.focus = 'input:fossil-name';

                return;
            }

            if (state.fossils.length >= 6) {
                status('Six fossils kept in this preview. Select one below to revisit it.');

                return;
            }

            const f = { sample: fossil.session, rotation: fossil.rotation, name };
            state.fossils.push(f);
            archiveChip('fossils', String(state.fossils.length).padStart(2, '0') + '// ' + name, () => {
                setFossil(f.sample, f.rotation, f.name);
                button('archive-fossil').disabled = true;
                status('Viewing ' + f.name + '. Archive is kept in this preview only.');
            });

            button('archive-fossil').disabled = true;
            status(name + ' archived. Kept in this preview only.');
        }
    };

    function inputValue(key, value) {
        if (key === 'response') {
            specimen.response = +value;
            meta.hint = 'Move to ' + (+value === 1 ? 'attract' : 'repel') + ' · Click to send a ripple';
            dirty();
        }

        if (key === 'motion') {
            if (specimen.freeze)
                releaseForm();

            specimen.motion = +value / 100;
            output('motion', value + '%');
        }

        if (key === 'workspace') {
            orbit.selected = +value;
            updateOrbit();
        }

        if (key === 'orbit') {
            orbit.bodies[orbit.selected].r = +value / 100;
            output('orbit', value + '%');
        }

        if (key === 'beat') {
            resonance.beat = value;
            status('Demo pattern changed. No sound or player connection.');
        }

        if (key === 'intensity') {
            resonance.intensity = +value / 100;
            output('intensity', value + '%');
        }

        if (key === 'gravity') {
            gravity.strength = +value / 100;
            output('gravity', value + '%');
        }

        if (key === 'particles') {
            gravity.count = +value;
            output('particles', value);
            makeParticles();
        }

        if (key === 'session') {
            setFossil(+value, 25, sessions[+value].name);
        }

        if (key === 'rotation') {
            fossil.rotation = +value;
            output('rotation', value + '°');
            button('archive-fossil').disabled = false;
        }

        if (key === 'fossil-name') {
            fossil.name = value;
            button('archive-fossil').disabled = false;
        }

        dirty();
    }

    function pointerMove(p, stamp) {
        state.pointer.x = p.x;
        state.pointer.y = p.y;
        state.pointer.inside = true;

        if (orbit.drag && state.mode === 1) {
            const d = orbit.drag;
            d.distance = Math.max(d.distance, Math.hypot(p.x - d.start.x, p.y - d.start.y));

            if (d.distance > 6) {
                const b = orbit.bodies[d.index], tilt = -.2 + d.index * .14, dx = p.x - state.w / 2, dy = p.y - state.h / 2 - 4, x = dx * Math.cos(tilt) + dy * Math.sin(tilt), y = -dx * Math.sin(tilt) + dy * Math.cos(tilt), max = Math.min(state.w * .38, state.h * .45);
                b.phase = Math.atan2(y / .47, x);
                b.r = clamp(Math.hypot(x, y / .47) / max, .3, 1);
                const elapsed = Math.max(.016, (stamp - d.lastStamp) / 1000), delta = Math.atan2(Math.sin(b.phase - d.lastPhase), Math.cos(b.phase - d.lastPhase));
                d.velocity = mix(d.velocity, clamp(delta / elapsed, -1.2, 1.2), .6);
                d.lastPhase = b.phase;
                d.lastStamp = stamp;
                output('orbit', Math.round(b.r * 100) + '%');
                field('orbit').value = b.r * 100;
            }
        }

        if (fossil.drag && state.mode === 5) {
            fossil.rotation = ((fossil.drag.rotation + (p.x - fossil.drag.x) * .65) % 360 + 360) % 360;
            field('rotation').value = Math.round(fossil.rotation);
            output('rotation', Math.round(fossil.rotation) + '°');
            button('archive-fossil').disabled = false;
        }

        dirty();
    }

    function pointerDown(p, stamp) {
        state.pointer = Object.assign(Object.assign({}, p), { inside: true, down: true });

        if (state.mode === 0)
            actions.ripple();

        if (state.mode === 1) {
            const hit = orbit.hits.reduce((best, p) => {
                const distance = Math.hypot(p.x - state.pointer.x, p.y - state.pointer.y);

                return distance < Math.max(p.r + 10, 24) && (!best || distance < best.distance) ? Object.assign(Object.assign({}, p), { distance }) : best;
            }, null);

            if (hit) {
                orbit.selected = hit.i;
                orbit.drag = { index: hit.i, start: p, distance: 0, lastStamp: stamp, lastPhase: orbit.bodies[hit.i].phase, velocity: 0 };
                updateOrbit();
            }
        }

        if (state.mode === 5)
            fossil.drag = { x: p.x, rotation: fossil.rotation };

        dirty();
    }

    function pointerUp() {
        if (state.mode === 4 && state.pointer.down) {
            burst(state.pointer.x, state.pointer.y);
            status('Well released. Hold again to catch the particles.');
        }

        if (orbit.drag && orbit.drag.distance > 6) {
            const b = orbit.bodies[orbit.drag.index];
            b.speed = Math.abs(orbit.drag.velocity) > .06 ? orbit.drag.velocity : b.speed;
            status('Orbit changed. The body keeps the momentum of your release.');
        }

        state.pointer.down = false;
        orbit.drag = null;
        fossil.drag = null;
        dirty();
    }

    function resize(w, h) {
        w = Math.max(1, w);
        h = Math.max(80, h);

        if (w === state.w && h === state.h)
            return;

        const oldW = state.w, oldH = state.h;
        state.w = w;
        state.h = h;

        for (const p of gravity.particles) {
            p.x *= w / oldW;
            p.y *= h / oldH;
            p.history = [];
        }

        dirty();
    }

    const api = { meta,
        get paused() {
            return state.paused;
        },
        setPaused(value) {
            if (state.paused !== value)
                actions.motion();
        },
        controls() {
            return fields.map(c => (Object.assign(Object.assign({}, c), { output: view.outputs[c.outputKey] || '', quality: c.key.startsWith('tune:') ? view.qualities[c.key.slice(5)] : undefined }))).concat(Object.values(view.buttons).filter(c => c.key !== 'motion'));
        },
        status() {
            return view.status;
        },
        archives() {
            return view.archives.map((a, i) => ({ key: 'archive:' + i, label: a.label }));
        },
        action(key, value) {
            var _a;
            view.focus = '';

            if (key.startsWith('input:')) {
                const f = field(key.slice(6));

                if (!f)
                    return;

                f.value = value;
                inputValue(key.slice(6), value);
            }
            else if (key.startsWith('tune:')) {
                signal.values[Number(key.slice(5))] = Number(value);
                updateSignal();
            }
            else if (key.startsWith('archive:'))
                (_a = view.archives[Number(key.slice(8))]) === null || _a === void 0 ? void 0 : _a.callback();
            else if (view.buttons[key] && !view.buttons[key].disabled && actions[key])
                actions[key]();

            return view.focus;
        },
        pointer(kind, x, y, stamp) {
            const p = { x, y };

            if (kind === 'move')
                pointerMove(p, stamp);

            if (kind === 'down')
                pointerDown(p, stamp);

            if (kind === 'up')
                pointerUp();

            if (kind === 'leave') {
                state.pointer.inside = false;
                dirty();
            }
        },
        key(key) {
            if (key === 'Escape' && state.mode === 4)
                releaseWells();
        },
        configure(settings) {
            Object.assign(design, settings);
            dirty();
        },
        needsMotion,
        render(context, w, h, elapsed) {
            ctx = context;
            resize(w, h);
            const dt = !state.paused && needsMotion() ? Math.min(.04, Math.max(0, elapsed)) : 0;
            state.time += dt;
            background();
            drawFossil(dt);
            state.dirty = false;
        },
        suspend() {
            state.pointer.down = false;
            state.pointer.inside = false;
            orbit.drag = null;
            fossil.drag = null;
            dirty();
        },
        inspect() {
            return { time: state.time, forms: state.forms.length, signals: state.signals.slice(), fossils: state.fossils.map(f => (Object.assign({}, f))), held: !!specimen.freeze, orbit: orbit.bodies.map(b => (Object.assign({}, b))), selected: orbit.selected, locked: signal.locked, wells: wells().length, particles: gravity.particles.length, playing: resonance.playing, rotation: fossil.rotation, name: fossil.name };
        }
    };

    updateMotion();
    status("Sample \u00b7 142 minutes \u00b7 3 projects \u00b7 8 switches \u00b7 no activity tracked.");

    if (state.mode === 1)
        updateOrbit();

    if (state.mode === 3)
        updateSignal(false);

    if (state.mode === 4)
        makeParticles();

    meta.hint = gestures[state.mode];
    meta.title = names[state.mode];
    meta.inlineAction = 'archive-fossil';

    return api;
}
