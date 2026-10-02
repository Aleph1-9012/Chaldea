// SPDX-License-Identifier: 0BSD
// Stochastic ink: simulation and drawing shared by the browser preview and the native QML host.
// Ink threads follow a strict attractor rule; chaos adds jitter and sudden ejections that fray them.
// Keep this file ES2016-compatible for Qt's JavaScript engine: no object spread or optional chaining.

function inkRules() {
    return [
        {
            key: 'lattice', label: 'LATTICE', name: 'Thomas', center: [0, 0, 0], scale: 1 / 4.1, rate: 3,
            flow: function (x, y, z, o) {
                o[0] = Math.sin(y) - .19 * x;
                o[1] = Math.sin(z) - .19 * y;
                o[2] = Math.sin(x) - .19 * z;
            }
        },
        {
            key: 'bloom', label: 'BLOOM', name: 'Aizawa', center: [0, .04, .74], scale: 1 / 1.5, rate: .36,
            flow: function (x, y, z, o) {
                o[0] = (z - .7) * x - 3.5 * y;
                o[1] = 3.5 * x + (z - .7) * y;
                o[2] = .6 + .95 * z - z * z * z / 3 - (x * x + y * y) * (1 + .25 * z) + .1 * z * x * x * x;
            }
        },
        {
            key: 'knot', label: 'KNOT', name: 'Halvorsen', center: [-2.91, -2.91, -2.91], scale: 1 / 9.2, rate: .15,
            flow: function (x, y, z, o) {
                o[0] = -1.89 * x - 4 * y - 4 * z - y * y;
                o[1] = -1.89 * y - 4 * z - 4 * x - z * z;
                o[2] = -1.89 * z - 4 * x - 4 * y - x * x;
            }
        }
    ];
}

function inkColor(hex, fallback) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    var n = parseInt(m ? m[1] : fallback.slice(1), 16);

    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function inkMix(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function inkRgba(c, alpha) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, alpha)).toFixed(3) + ')';
}

function createArtEngine() {
    var RULES = inkRules();
    var TRAIL = 60, GROUP = 5, DEPTH = 3.4, BLUR_LEVELS = 4, ALPHA = [.1, .24, .42, .66, .94], BLUR_ALPHA = [1, .5, .2, .07], BLUR_WIDTH = [.7, 1.1, 2, 3.4], HALO = [0, 0, 2.6, 3];
    var DETAIL = { Sparse: 150, Fine: 260, Dense: 420 };
    var settings = { paper: '#f6f5f2', ink: '#16151a', detail: 'Fine' };
    var palette = null;
    var rule = 0, chaos = .38, focus = .5, orbit = .3;
    var seed = 9012, particles = [], pool = [];
    var paused = false, time = 0, yaw = .6, pitch = -.32, yawNudge = 0, pitchNudge = 0;
    var width = 700, height = 440;
    var pull = { active: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, stamp: 0, started: 0 };
    var flowOut = [0, 0, 0], message = 'Drag through the ink to draw threads out. Tap to release a burst.';
    var buckets = [];

    for (var b = 0; b < BLUR_LEVELS * ALPHA.length; b++)
        buckets.push([]);

    function random() {
        // mulberry32: a seeded generator keeps every reseed reproducible.
        seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function gauss() {
        return (random() + random() + random() + random() - 2) * 1.73;
    }

    function direction(o) {
        var z = random() * 2 - 1, a = random() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        o[0] = Math.cos(a) * r;
        o[1] = Math.sin(a) * r;
        o[2] = z;

        return o;
    }

    function field(u, o) {
        // Strict rule: the selected attractor's flow, measured in a shared unit sphere.
        var r = RULES[rule];
        r.flow(u[0] / r.scale + r.center[0], u[1] / r.scale + r.center[1], u[2] / r.scale + r.center[2], o);
        var k = r.scale * r.rate;
        o[0] *= k;
        o[1] *= k;
        o[2] *= k;
        var speed = Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]);

        if (speed > 2.6) {
            o[0] *= 2.6 / speed;
            o[1] *= 2.6 / speed;
            o[2] *= 2.6 / speed;
        }

        return o;
    }

    function buildPool() {
        // Sample points along one long trajectory so free threads respawn on the attractor itself.
        var u = [.05, .02, .08], v = [0, 0, 0], mid = [0, 0, 0];
        pool = [];

        for (var i = 0; i < 2600; i++) {
            field(u, v);
            mid[0] = u[0] + v[0] * .0125;
            mid[1] = u[1] + v[1] * .0125;
            mid[2] = u[2] + v[2] * .0125;
            field(mid, v);
            u[0] += v[0] * .025;
            u[1] += v[1] * .025;
            u[2] += v[2] * .025;

            if (i > 400 && i % 7 === 0)
                pool.push([u[0], u[1], u[2]]);
        }
    }

    function place(p, x, y, z) {
        p.u[0] = x;
        p.u[1] = y;
        p.u[2] = z;
        p.head = 0;
        p.count = 1;
        p.trail[0] = x;
        p.trail[1] = y;
        p.trail[2] = z;
        p.k[0] = p.k[1] = p.k[2] = 0;
        p.n[0] = p.n[1] = p.n[2] = 0;
    }

    // Threads travel in ribbons of GROUP particles that share noise and kicks, so they fan out together.
    function respawnGroup(g, age) {
        var first = g * GROUP, last = Math.min(particles.length, first + GROUP), lead = particles[first], at, spread = [0, 0, 0];

        if (lead.home > .5)
            at = [gauss() * .07, gauss() * .07, gauss() * .07];
        else {
            var q = pool[Math.floor(random() * pool.length)];
            at = [q[0], q[1], q[2]];
        }

        direction(spread);
        lead.life = 5 + random() * 8;
        lead.g[0] = lead.g[1] = lead.g[2] = 0;

        for (var i = first; i < last; i++) {
            var p = particles[i], offset = (i - first - (GROUP - 1) / 2) * .014;
            place(p, at[0] + spread[0] * offset + gauss() * .003, at[1] + spread[1] * offset + gauss() * .003, at[2] + spread[2] * offset + gauss() * .003);
            p.bind = p.home;
            p.life = lead.life;
            p.age = age === undefined ? 0 : age * p.life;
        }
    }

    function makeParticle(index) {
        return { u: [0, 0, 0], k: [0, 0, 0], n: [0, 0, 0], g: [0, 0, 0], trail: new Float32Array(TRAIL * 3), screen: new Float32Array(TRAIL * 2), head: 0, count: 0, home: Math.floor(index / GROUP) % 5 < 3 ? 1 : 0, bind: 0, age: 0, life: 1, sx: -1e4, sy: -1e4, scale: 1 };
    }

    function populate() {
        var target = DETAIL[settings.detail] || DETAIL.Fine, start = particles.length;

        while (particles.length > target)
            particles.pop();

        while (particles.length < target)
            particles.push(makeParticle(particles.length));

        for (var g = Math.ceil(start / GROUP); g * GROUP < particles.length; g++)
            respawnGroup(g, random() * .7);
    }

    function step(dt) {
        var c = chaos, swirlX = Math.sin(time * .13), swirlY = Math.cos(time * .11), swirlZ = Math.sin(time * .07 + 1);
        var decay = Math.exp(-1.7 * dt), drift = Math.exp(-1.6 * dt), kick = Math.sqrt(1 - drift * drift), v = flowOut, dir = [0, 0, 0];
        var reach = Math.min(width, height) * .2, reach2 = reach * reach;
        var cy = Math.cos(yaw + yawNudge), sy = Math.sin(yaw + yawNudge), cp = Math.cos(pitch + pitchNudge), sp = Math.sin(pitch + pitchNudge);
        time += dt;

        for (var first = 0; first < particles.length; first += GROUP) {
            var lead = particles[first], last = Math.min(particles.length, first + GROUP), g = lead.g;

            if (lead.age + dt > lead.life) {
                respawnGroup(first / GROUP);
                continue;
            }

            // Shared unit noise for the ribbon, correlated in time so threads curve instead of zigzag.
            g[0] = g[0] * drift + gauss() * kick;
            g[1] = g[1] * drift + gauss() * kick;
            g[2] = g[2] * drift + gauss() * kick;
            // Chaos: occasional ejections fling a ribbon loose; the rule then reels it back in.
            var eject = random() < c * .3 * dt, force = 1.3 + random() * 2.4, release = 0;

            if (eject)
                direction(dir);
            else if (lead.home > .5 && random() < (.25 + c * .6) * dt) {
                // Core spikes: short radial jabs that leave the knot bristling, then snap back.
                var ux = lead.u[0], uy = lead.u[1], uz = lead.u[2], r = Math.sqrt(ux * ux + uy * uy + uz * uz) + 1e-6;
                direction(dir);
                dir[0] = dir[0] * .45 + ux / r;
                dir[1] = dir[1] * .45 + uy / r;
                dir[2] = dir[2] * .45 + uz / r;
                force = 1 + random() * 1.6;
                release = .8;
                eject = true;
            }

            for (var i = first; i < last; i++) {
                var p = particles[i], u = p.u;
                p.age += dt;

                if (eject) {
                    var jitter = 1 + gauss() * .04;
                    p.k[0] = dir[0] * force * jitter;
                    p.k[1] = dir[1] * force * jitter;
                    p.k[2] = dir[2] * force * jitter;
                    p.bind = Math.min(p.bind, release);
                }

                // Held ink: near the pointer, the rule loosens its grip and the ink takes the pointer's momentum.
                var held = 0;

                if (pull.active) {
                    var dx = pull.x - p.sx, dy = pull.y - p.sy, d2 = dx * dx + dy * dy;

                    if (d2 < reach2) {
                        held = 1 - Math.sqrt(d2) / reach;
                        var vx = pull.vx / p.scale, vy = pull.vy / p.scale, carry = held * Math.min(1, dt * 9);
                        p.k[0] += (cy * vx + sy * sp * vy - p.k[0]) * carry;
                        p.k[1] += (cp * vy - p.k[1]) * carry;
                        p.k[2] += (sy * vx - cy * sp * vy - p.k[2]) * carry;
                        p.bind = Math.min(p.bind, .12);
                        p.life = Math.max(p.life, p.age + 1.5);
                        lead.life = Math.max(lead.life, lead.age + 1.5);
                    }
                }

                var b = p.bind, loose = 1 - held * .85;
                field(u, v);
                // The core is its own rule: a tight swirling knot that holds bound ink in place.
                var coreX = -2.4 * u[0] + (swirlY * u[2] - swirlZ * u[1]) * 2.2;
                var coreY = -2.4 * u[1] + (swirlZ * u[0] - swirlX * u[2]) * 2.2;
                var coreZ = -2.4 * u[2] + (swirlX * u[1] - swirlY * u[0]) * 2.2;
                // Bound ink scribbles on its own; loose ink stays coherent with its ribbon.
                var amp = (.26 + c * .36) * b + c * .95 * (1 - b), shared = 1 - b * .6, own = Math.sqrt(1 - shared * shared);
                p.n[0] = p.n[0] * drift + gauss() * kick;
                p.n[1] = p.n[1] * drift + gauss() * kick;
                p.n[2] = p.n[2] * drift + gauss() * kick;
                u[0] += ((v[0] * (1 - b) + coreX * b + (g[0] * shared + p.n[0] * own) * amp) * loose + p.k[0]) * dt;
                u[1] += ((v[1] * (1 - b) + coreY * b + (g[1] * shared + p.n[1] * own) * amp) * loose + p.k[1]) * dt;
                u[2] += ((v[2] * (1 - b) + coreZ * b + (g[2] * shared + p.n[2] * own) * amp) * loose + p.k[2]) * dt;
                p.k[0] *= decay;
                p.k[1] *= decay;
                p.k[2] *= decay;
                p.bind += (p.home - p.bind) * Math.min(1, dt * .33);

                if (held) {
                    // Draw held ink toward the pointer at its own depth, rotated back into world space.
                    var f = held * Math.min(1, dt * 7), mx = dx / p.scale * f, my = dy / p.scale * f, z1 = -sp * my;
                    u[0] += cy * mx - sy * z1;
                    u[1] += cp * my;
                    u[2] += sy * mx + cy * z1;
                }

                if (!(u[0] * u[0] + u[1] * u[1] + u[2] * u[2] < 16)) {
                    place(p, lead.u[0], lead.u[1], lead.u[2]);
                    continue;
                }

                p.head = (p.head + 1) % TRAIL;
                p.trail[p.head * 3] = u[0];
                p.trail[p.head * 3 + 1] = u[1];
                p.trail[p.head * 3 + 2] = u[2];
                p.count = Math.min(TRAIL, p.count + 1);
            }
        }
    }

    function screenToWorld(x, y) {
        var R = Math.min(width, height) * .4, cy = Math.cos(yaw + yawNudge), sy = Math.sin(yaw + yawNudge), cp = Math.cos(pitch + pitchNudge), sp = Math.sin(pitch + pitchNudge);
        var x1 = (x - width / 2) / R, y2 = (y - height / 2) / R;
        var wy = cp * y2, z1 = -sp * y2;

        return [cy * x1 - sy * z1, wy, sy * x1 + cy * z1];
    }

    function burst(x, y) {
        var at = screenToWorld(x, y), dir = [0, 0, 0], spread = [0, 0, 0], groups = Math.ceil(particles.length / GROUP);

        for (var n = Math.round(groups * .2); n > 0; n--) {
            var first = Math.floor(random() * groups) * GROUP, last = Math.min(particles.length, first + GROUP), force = 1.5 + random() * 2.8, life = 3.5 + random() * 5;
            direction(dir);
            direction(spread);

            for (var i = first; i < last; i++) {
                var p = particles[i], offset = (i - first - (GROUP - 1) / 2) * .006, jitter = 1 + gauss() * .05;
                place(p, at[0] + spread[0] * offset, at[1] + spread[1] * offset, at[2] + spread[2] * offset);
                p.k[0] = dir[0] * force * jitter;
                p.k[1] = dir[1] * force * jitter;
                p.k[2] = dir[2] * force * jitter;
                p.bind = 0;
                p.age = 0;
                p.life = life;
            }
        }

        message = 'Burst released. The rule gathers the threads back.';
    }

    function makePalette() {
        var paper = inkColor(settings.paper, '#f6f5f2'), ink = inkColor(settings.ink, '#16151a'), styles = [];

        for (var L = 0; L < BLUR_LEVELS; L++)
            for (var A = 0; A < ALPHA.length; A++) {
                var alpha = ALPHA[A] * BLUR_ALPHA[L];
                styles.push({ width: BLUR_WIDTH[L], stroke: inkRgba(ink, alpha), halo: HALO[L] ? inkRgba(ink, alpha * .4) : '', haloWidth: BLUR_WIDTH[L] * HALO[L] });
            }

        palette = { paper: inkRgba(paper, 1), edge: inkRgba(inkMix(paper, ink, .07), 1), styles: styles, pool: function (alpha) { return inkRgba(ink, alpha); } };
    }

    function draw(ctx, w, h) {
        var R = Math.min(w, h) * .4, cx = w / 2, cyScreen = h / 2;
        var cy = Math.cos(yaw + yawNudge), sy = Math.sin(yaw + yawNudge), cp = Math.cos(pitch + pitchNudge), sp = Math.sin(pitch + pitchNudge);
        var focal = -1.1 + focus * 2.2, i, j;
        ctx.fillStyle = palette.paper;
        ctx.fillRect(0, 0, w, h);
        var glow = ctx.createRadialGradient(cx, cyScreen, R * .2, cx, cyScreen, Math.sqrt(w * w + h * h) * .62);
        glow.addColorStop(0, palette.paper);
        glow.addColorStop(1, palette.edge);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // A soft ink pool under the knot; it spreads and pales as the core leaves the focal plane.
        var coreBlur = Math.min(1.4, Math.abs(focal) * 1.3), stainRadius = R * (.13 + coreBlur * .12);
        var stain = ctx.createRadialGradient(cx, cyScreen, 0, cx, cyScreen, stainRadius);
        stain.addColorStop(0, palette.pool(.2 / (1 + coreBlur * 2)));
        stain.addColorStop(1, palette.pool(0));
        ctx.fillStyle = stain;
        ctx.fillRect(cx - stainRadius, cyScreen - stainRadius, stainRadius * 2, stainRadius * 2);

        for (i = 0; i < buckets.length; i++)
            buckets[i].length = 0;

        for (i = 0; i < particles.length; i++) {
            var p = particles[i], hx = p.u[0], hy = p.u[1], hz = p.u[2];
            var x1 = hx * cy + hz * sy, z1 = -hx * sy + hz * cy, y2 = hy * cp - z1 * sp, z2 = hy * sp + z1 * cp, s = DEPTH / (DEPTH + z2) * R;
            p.sx = cx + x1 * s;
            p.sy = cyScreen + y2 * s;
            p.scale = s;

            if (p.count < 2)
                continue;

            var fade = Math.min(1, p.age / .6) * Math.min(1, (p.life - p.age) / 1.2) * Math.max(.5, Math.min(1, 1.1 - z2 * .25));
            var A = fade > .8 ? 4 : fade > .58 ? 3 : fade > .36 ? 2 : fade > .16 ? 1 : fade > .05 ? 0 : -1;

            if (A < 0)
                continue;

            var blur = Math.abs(z2 - focal) * 1.3, L = blur < .2 ? 0 : blur < .5 ? 1 : blur < .9 ? 2 : 3;
            var points = p.screen;

            for (j = 0; j < p.count; j++) {
                var t = ((p.head - j) % TRAIL + TRAIL) % TRAIL * 3, x = p.trail[t], y = p.trail[t + 1], z = p.trail[t + 2];
                var a1 = x * cy + z * sy, b1 = -x * sy + z * cy, a2 = y * cp - b1 * sp, b2 = y * sp + b1 * cp, k = DEPTH / (DEPTH + b2) * R;
                points[j * 2] = cx + a1 * k;
                points[j * 2 + 1] = cyScreen + a2 * k;
            }

            // The newer half draws darker than the tail, so threads taper as they age.
            var split = Math.ceil(p.count / 2);
            buckets[L * ALPHA.length + A].push(points, 0, Math.min(p.count, split + 1));

            if (A >= 2 && p.count > split + 1)
                buckets[L * ALPHA.length + A - 2].push(points, split, p.count);
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (var L2 = BLUR_LEVELS - 1; L2 >= 0; L2--)
            for (var A2 = 0; A2 < ALPHA.length; A2++) {
                var list = buckets[L2 * ALPHA.length + A2], style = palette.styles[L2 * ALPHA.length + A2];

                if (!list.length)
                    continue;

                ctx.beginPath();

                for (i = 0; i < list.length; i += 3) {
                    var pts = list[i], from = list[i + 1], to = list[i + 2];
                    ctx.moveTo(pts[from * 2], pts[from * 2 + 1]);

                    for (j = from + 1; j < to; j++)
                        ctx.lineTo(pts[j * 2], pts[j * 2 + 1]);
                }

                if (style.halo) {
                    ctx.strokeStyle = style.halo;
                    ctx.lineWidth = style.haloWidth;
                    ctx.stroke();
                }

                ctx.strokeStyle = style.stroke;
                ctx.lineWidth = style.width;
                ctx.stroke();
            }
    }

    function describe() {
        var r = RULES[rule], tone = chaos < .08 ? 'precise' : chaos < .45 ? 'restless' : chaos < .8 ? 'unruly' : 'feral';

        return 'Rule ' + r.label.toLowerCase() + ' (' + r.name + '), chaos ' + Math.round(chaos * 100) + ': ' + tone + '.';
    }

    function reseed() {
        seed = (seed * 31 + 7) | 0;
        particles = [];
        time = 0;
        populate();

        for (var n = 0; n < 110; n++)
            step(.033);
    }

    buildPool();
    makePalette();
    reseed();

    var api = {
        meta: { title: 'STOCHASTIC INK', brand: 'CHALDEA // INK STUDY', hint: 'Drag through the ink to draw threads out. Tap to release a burst. Arrow keys turn the view.' },
        get paused() {
            return paused;
        },
        setPaused: function (value) {
            paused = !!value;

            if (paused)
                api.suspend();
        },
        controls: function () {
            return [
                { type: 'select', key: 'rule', label: 'RULE', value: RULES[rule].key, options: RULES.map(function (r) { return { value: r.key, label: r.label }; }) },
                { type: 'range', key: 'chaos', label: 'CHAOS', value: Math.round(chaos * 100), min: 0, max: 100, step: 1 },
                { type: 'range', key: 'focus', label: 'FOCUS', value: Math.round(focus * 100), min: 0, max: 100, step: 1 },
                { type: 'range', key: 'orbit', label: 'ORBIT', value: Math.round(orbit * 100), min: 0, max: 100, step: 1 },
                { type: 'button', key: 'burst', label: 'BURST' },
                { type: 'button', key: 'reseed', label: 'RESEED' }
            ];
        },
        action: function (key, value) {
            if (key === 'rule') {
                for (var i = 0; i < RULES.length; i++)
                    if (RULES[i].key === value)
                        rule = i;

                buildPool();
                message = describe();
            }

            if (key === 'chaos') {
                chaos = Math.max(0, Math.min(100, Number(value))) / 100;
                message = describe();
            }

            if (key === 'focus') {
                focus = Math.max(0, Math.min(100, Number(value))) / 100;
                message = focus < .4 ? 'Focus pulled forward.' : focus > .6 ? 'Focus pushed back.' : 'Focus on the core.';
            }

            if (key === 'orbit') {
                orbit = Math.max(0, Math.min(100, Number(value))) / 100;
                message = orbit === 0 ? 'Orbit stopped. The view holds still.' : 'Orbit ' + Math.round(orbit * 100) + '.';
            }

            if (key === 'burst')
                burst(width / 2, height / 2);

            if (key === 'reseed') {
                reseed();
                message = 'Reseeded. A new pattern grows from the same rule.';
            }
        },
        pointer: function (kind, x, y, now) {
            var stamp = now || Date.now();

            if (kind === 'down') {
                pull.active = true;
                pull.moved = false;
                pull.x = pull.sx = x;
                pull.y = pull.sy = y;
                pull.vx = pull.vy = 0;
                pull.started = pull.stamp = stamp;
            }

            if (kind === 'move' && pull.active) {
                var gap = Math.max(8, stamp - pull.stamp) / 1000, mix = Math.min(1, gap * 12);
                pull.vx += (Math.max(-2400, Math.min(2400, (x - pull.x) / gap)) - pull.vx) * mix;
                pull.vy += (Math.max(-2400, Math.min(2400, (y - pull.y) / gap)) - pull.vy) * mix;
                pull.stamp = stamp;
                pull.x = x;
                pull.y = y;

                if (Math.abs(x - pull.sx) + Math.abs(y - pull.sy) > 7)
                    pull.moved = true;
            }

            if (kind === 'up' && pull.active) {
                pull.active = false;

                if (!pull.moved && stamp - pull.started < 450)
                    burst(pull.sx, pull.sy);
                else
                    message = 'Threads released. They drift back under the rule.';
            }

            if (kind === 'leave' || kind === 'cancel')
                pull.active = false;

            if (pull.active && pull.moved)
                message = 'Drawing threads out of the ink.';
        },
        key: function (name) {
            if (name === 'ArrowLeft')
                yawNudge -= .14;

            if (name === 'ArrowRight')
                yawNudge += .14;

            if (name === 'ArrowUp')
                pitchNudge = Math.max(-1.2, pitchNudge - .1);

            if (name === 'ArrowDown')
                pitchNudge = Math.min(1.2, pitchNudge + .1);

            if (name === 'Enter' || name === ' ')
                burst(width / 2, height / 2);

            if (name === 'Escape')
                api.suspend();
        },
        configure: function (value) {
            for (var key in value)
                if (Object.prototype.hasOwnProperty.call(settings, key) && value[key] !== undefined && value[key] !== null)
                    settings[key] = String(value[key]);

            makePalette();
            populate();
        },
        needsMotion: function () {
            return true;
        },
        render: function (ctx, w, h, elapsed) {
            width = w;
            height = h;
            var dt = paused ? 0 : Math.min(.05, Math.max(0, elapsed || 0));

            if (dt) {
                yaw += orbit * .35 * dt;
                pitch = -.32 + Math.sin(time * .09) * .12;
                step(dt);
            }

            draw(ctx, w, h);
        },
        status: function () {
            return message;
        },
        suspend: function () {
            pull.active = false;
        },
        inspect: function () {
            return { time: time, paused: paused, particles: particles.length, rule: RULES[rule].key, chaos: chaos, focus: focus, orbit: orbit, pulling: pull.active };
        }
    };

    return api;
}
