// SPDX-License-Identifier: 0BSD
// Original simulation and drawing rules, shared by browser and QML hosts.
function createArtEngine() {
    let ctx;
    const bone = a => `rgba(232,232,232,${a})`;
    const TAU = Math.PI * 2, clamp = (n, a, b) => Math.max(a, Math.min(b, n)), mix = (a, b, t) => a + (b - a) * t;
    const design = { accent: '#cc1515' };
    const state = { paused: false, time: 0, w: 700, h: 380 };
    const orbit = { selected: 2, bodies: Array.from({ length: 5 }, (_, i) => ({ phase: i * 1.24, r: .4 + i * .125, speed: (i % 2 ? -1 : 1) * (.15 + i * .028) })), hits: [], drag: null };
    const meta = { style: 'lab', title: 'Orbital playground', hint: 'Drag a body, then let go · Click to select', brand: 'TSUGUMORI // PLAY', fields: 2 };
    const fields = [{ "key": "input:workspace", "type": "select", "label": "Preview workspace", "value": "2", "options": [{ "value": "0", "label": "01// terminal" }, { "value": "1", "label": "02// browser" }, { "value": "2", "label": "03// editor" }, { "value": "3", "label": "04// music" }, { "value": "4", "label": "05// files" }] }, { "key": "input:orbit", "type": "range", "label": "Orbit radius", "value": 65, "min": 30, "max": 100, "step": 1, "outputKey": "orbit" }];
    const view = { buttons: { "motion": { "key": "motion", "type": "button", "label": "Pause motion", "disabled": false, "hidden": false, "pressed": false }, "orbit-impulse": { "key": "orbit-impulse", "type": "button", "label": "Give it a push", "disabled": false, "hidden": false, "pressed": false }, "orbit-reverse": { "key": "orbit-reverse", "type": "button", "label": "Reverse orbit", "disabled": false, "hidden": false, "pressed": false } }, outputs: { "orbit": "65%" }, status: "" };

    function status(value) {
        view.status = value;
    }

    function output(key, value) {
        view.outputs[key] = String(value);
    }

    function field(key) {
        return fields.find(c => c.key === 'input:' + key);
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
    }

    function orbitGeometry() {
        const bodySize = clamp(Math.min(state.w * .035, state.h * .075), 13, 28);
        const top = 46 + bodySize, bottom = state.h - 58 - bodySize;

        return {
            cx: state.w / 2,
            cy: (top + bottom) / 2,
            x: Math.max(1, state.w / 2 - bodySize - 36),
            y: Math.max(1, (bottom - top) / 1.25),
            bodySize
        };
    }

    function orbitPoint(i, phase, r) {
        const geometry = orbitGeometry(), tilt = -.20 + i * .14;
        const x = Math.cos(phase) * r, y = Math.sin(phase) * r * .47;

        return {
            x: geometry.cx + (x * Math.cos(tilt) - y * Math.sin(tilt)) * geometry.x,
            y: geometry.cy + (x * Math.sin(tilt) + y * Math.cos(tilt)) * geometry.y,
            z: Math.sin(phase)
        };
    }

    function sphere(x, y, r, active, angle) {
        const points = [], front = [], back = [];
        dot(x, y, r * 1.025, '#0a0a0a');

        function wire(path) {
            for (let i = 1; i < path.length; i++) {
                const edges = (path[i - 1].z + path[i].z) / 2 < 0 ? front : back;
                edges.push([path[i - 1], path[i]]);
            }
        }

        for (let j = 1; j < 10; j++) {
            const lat = -Math.PI / 2 + j / 10 * Math.PI, ring = [];

            for (let k = 0; k <= 48; k++) {
                const a = k / 48 * TAU + angle;
                const p = project(Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a), r, .35, .2, x, y);
                ring.push(p);

                if (k < 48 && k % 4 === 0)
                    points.push(p);
            }

            wire(ring);
        }

        for (let k = 0; k < 10; k++) {
            const a = k / 10 * TAU + angle, path = [];

            for (let j = 0; j <= 24; j++) {
                const lat = -Math.PI / 2 + j / 24 * Math.PI;
                path.push(project(Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a), r, .35, .2, x, y));
            }

            wire(path);
        }

        for (const edges of [back, front]) {
            const visible = edges === front;
            ctx.beginPath();

            for (const [a, b] of edges) {
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
            }

            ctx.strokeStyle = active ? accent(visible ? .85 : .24) : bone(visible ? .52 : .14);
            ctx.lineWidth = visible ? .85 : .65;
            ctx.stroke();
        }

        for (const p of points) {
            if (p.z < 0)
                dot(p.x, p.y, .8, active ? accent(1) : bone(.8));
        }

        if (active) {
            ctx.strokeStyle = accent(.9);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, r + 6, 0, TAU);
            ctx.stroke();
        }
    }

    function orbitLabels(bodies) {
        const labels = ['terminal', 'browser', 'editor', 'music', 'files'];
        const placed = [], size = state.w < 420 ? 11 : 12, height = 22;
        const ordered = bodies.slice().sort((a, b) => Number(b.i === orbit.selected) - Number(a.i === orbit.selected) || a.i - b.i);
        ctx.font = size + 'px "Share Tech Mono", monospace';

        function overlap(a, b) {
            return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
                * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        }

        for (const body of ordered) {
            const label = String(body.i + 1).padStart(2, '0') + '// ' + labels[body.i];
            const width = ctx.measureText(label).width + 16;
            let best;

            function consider(x, y, preference = 0) {
                x = clamp(x, 22, state.w - width - 22);
                y = clamp(y, 36, state.h - height - 54);
                const candidate = { x, y, width, height };
                let bodyOverlap = 0, labelOverlap = 0;

                for (const other of bodies)
                    bodyOverlap += overlap(candidate, { x: other.x - other.r - 7, y: other.y - other.r - 7, width: (other.r + 7) * 2, height: (other.r + 7) * 2 });

                for (const other of placed)
                    labelOverlap += overlap(candidate, { x: other.x - 4, y: other.y - 4, width: other.width + 8, height: other.height + 8 });

                const score = labelOverlap * 1000000 + bodyOverlap * 10000 + Math.hypot(x + width / 2 - body.x, y + height / 2 - body.y) + preference;

                if (!best || score < best.score)
                    best = Object.assign({ score, collision: bodyOverlap + labelOverlap }, candidate);
            }

            for (let ring = 0; ring < 5; ring++) {
                for (let direction = 0; direction < 8; direction++) {
                    const angle = Math.PI / 2 + direction * TAU / 8;
                    const x = body.x + Math.cos(angle) * (body.r + width / 2 + 12 + ring * 20) - width / 2;
                    const y = body.y + Math.sin(angle) * (body.r + height / 2 + 12 + ring * 24) - height / 2;
                    consider(x, y, direction * .1);
                }
            }

            if (best.collision > 0) {
                for (let y = 36; y <= state.h - height - 54; y += height + 8) {
                    for (let x = 22; x <= state.w - width - 22; x += 20)
                        consider(x, y);
                }
            }

            const active = body.i === orbit.selected;
            const end = { x: clamp(body.x, best.x, best.x + best.width), y: clamp(body.y, best.y, best.y + best.height) };
            const dx = end.x - body.x, dy = end.y - body.y, distance = Math.hypot(dx, dy);

            if (distance > body.r + 8) {
                const start = { x: body.x + dx / distance * (body.r + 7), y: body.y + dy / distance * (body.r + 7) };
                line([start, end], active ? accent(.65) : bone(.3), .8);
            }

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(best.x, best.y, best.width, best.height);
            text(label, best.x + best.width / 2, best.y + height / 2 + size * .34, active ? '#e8e8e8' : bone(.78), 'center', size);
            placed.push(best);
        }
    }

    function drawOrbit(dt) {
        orbit.hits = [];
        const geometry = orbitGeometry();

        orbit.bodies.forEach((body, i) => {
            if (!orbit.drag || orbit.drag.index !== i)
                body.phase += body.speed * dt;

            const path = [];

            for (let k = 0; k <= 160; k++)
                path.push(orbitPoint(i, k / 160 * TAU, body.r));

            line(path, i === orbit.selected ? accent(.6) : bone(.24), i === orbit.selected ? 1 : .8);
        });

        dot(geometry.cx, geometry.cy, 3, bone(.9));
        line([{ x: geometry.cx - 10, y: geometry.cy }, { x: geometry.cx + 10, y: geometry.cy }], bone(.4));
        const bodies = orbit.bodies.map((b, i) => Object.assign(orbitPoint(i, b.phase, b.r), { i })).sort((a, b) => a.z - b.z);

        for (const p of bodies) {
            const radius = geometry.bodySize + (p.i === 2 ? 4 : 0) + p.z * 2;
            sphere(p.x, p.y, radius, p.i === orbit.selected, state.time * .18 + p.i);
            orbit.hits.push(Object.assign({ r: radius }, p));
        }

        orbitLabels(orbit.hits);
    }

    function updateMotion() {
        view.buttons.motion.label = state.paused ? 'Resume motion' : 'Pause motion';
        view.buttons.motion.pressed = state.paused;
    }

    function updateOrbit() {
        const b = orbit.bodies[orbit.selected];
        field('workspace').value = String(orbit.selected);
        field('orbit').value = String(Math.round(b.r * 100));
        output('orbit', Math.round(b.r * 100) + '%');
        status('Preview workspace ' + String(orbit.selected + 1).padStart(2, '0') + ' selected. Your real workspaces stay unchanged.');
    }

    const actions = {
        motion() {
            state.paused = !state.paused;
            updateMotion();
            status(state.paused ? 'Motion paused. Controls still work.' : 'Motion resumed.');
        },
        'orbit-impulse'() {
            const body = orbit.bodies[orbit.selected];
            body.speed = clamp(body.speed * 1.65, -1.2, 1.2);
            status('Impulse applied to preview workspace ' + String(orbit.selected + 1).padStart(2, '0') + '.');
        },
        'orbit-reverse'() {
            orbit.bodies[orbit.selected].speed *= -1;
            status('Orbit direction reversed.');
        },
    };

    function inputValue(key, value) {
        if (key === 'workspace') {
            orbit.selected = +value;
            updateOrbit();
        }

        if (key === 'orbit') {
            orbit.bodies[orbit.selected].r = +value / 100;
            output('orbit', value + '%');
        }
    }

    function pointerMove(p, stamp) {
        const d = orbit.drag;

        if (!d) return;

        d.distance = Math.max(d.distance, Math.hypot(p.x - d.start.x, p.y - d.start.y));

        if (d.distance <= 6) return;

        const b = orbit.bodies[d.index], geometry = orbitGeometry(), tilt = -.2 + d.index * .14;
        const dx = (p.x - geometry.cx) / geometry.x, dy = (p.y - geometry.cy) / geometry.y;
        const x = dx * Math.cos(tilt) + dy * Math.sin(tilt), y = (-dx * Math.sin(tilt) + dy * Math.cos(tilt)) / .47;
        b.phase = Math.atan2(y, x);
        b.r = clamp(Math.hypot(x, y), .3, 1);

        const elapsed = Math.max(.016, (stamp - d.lastStamp) / 1000), delta = Math.atan2(Math.sin(b.phase - d.lastPhase), Math.cos(b.phase - d.lastPhase));
        d.velocity = mix(d.velocity, clamp(delta / elapsed, -1.2, 1.2), .6);
        d.lastPhase = b.phase;
        d.lastStamp = stamp;
        output('orbit', Math.round(b.r * 100) + '%');
        field('orbit').value = b.r * 100;
    }

    function pointerDown(point, stamp) {
        const foreground = orbit.hits.slice().reverse().find(p => Math.hypot(p.x - point.x, p.y - point.y) <= p.r);
        const hit = foreground || orbit.hits.reduce((best, p) => {
            const distance = Math.hypot(p.x - point.x, p.y - point.y);

            return distance < Math.max(p.r + 10, 24) && (!best || distance < best.distance) ? Object.assign({ distance }, p) : best;
        }, null);

        if (!hit) return;

        orbit.selected = hit.i;
        orbit.drag = { index: hit.i, start: point, distance: 0, lastStamp: stamp, lastPhase: orbit.bodies[hit.i].phase, velocity: 0 };
        updateOrbit();
    }

    function pointerUp() {
        if (orbit.drag && orbit.drag.distance > 6) {
            const b = orbit.bodies[orbit.drag.index];
            b.speed = Math.abs(orbit.drag.velocity) > .06 ? orbit.drag.velocity : b.speed;
            status('Orbit changed. The body keeps the momentum of your release.');
        }

        orbit.drag = null;
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
            return fields.map(c => Object.assign({}, c, { output: view.outputs[c.outputKey] || '' })).concat(Object.values(view.buttons).filter(c => c.key !== 'motion'));
        },
        status() {
            return view.status;
        },
        archives() {
            return [];
        },
        action(key, value) {
            if (key.startsWith('input:')) {
                const f = field(key.slice(6));

                if (!f)
                    return;

                f.value = value;
                inputValue(key.slice(6), value);
            }
            else if (view.buttons[key] && !view.buttons[key].disabled && actions[key])
                actions[key]();
        },
        pointer(kind, x, y, stamp) {
            const p = { x, y };

            if (kind === 'move')
                pointerMove(p, stamp);

            if (kind === 'down')
                pointerDown(p, stamp);

            if (kind === 'up')
                pointerUp();
        },
        // The shared native host forwards keys; this design has no canvas shortcuts.
        key() {},
        configure(settings) {
            Object.assign(design, settings);
        },
        needsMotion() {
            return true;
        },
        render(context, w, h, elapsed) {
            ctx = context;
            state.w = Math.max(1, w);
            state.h = Math.max(80, h);

            const dt = state.paused ? 0 : Math.min(.04, Math.max(0, elapsed));
            state.time += dt;
            background();
            drawOrbit(dt);
        },
        suspend() {
            orbit.drag = null;
        },
        inspect() {
            return { time: state.time, orbit: orbit.bodies.map(b => Object.assign({}, b)), selected: orbit.selected };
        }
    };

    updateMotion();
    updateOrbit();

    return api;
}
