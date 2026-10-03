// SPDX-License-Identifier: 0BSD
// Stochastic ink: simulation and drawing shared by the browser preview and the native QML host.
// Precise rules: crisp geometric loops (rose, Lissajous, torus knot) drawn on a pulse.
// Stochastic chaos: a chaotic flow field takes each loop apart into lace, combed sheets, and smoke.
// Ink is accumulated as density in four depth-of-field layers, blurred, and composited as pixels.
// Keep this file ES2016-compatible for Qt's JavaScript engine: no object spread or optional chaining.

function inkCurves() {
    return [
        {
            key: 'rose', label: 'ROSE',
            variants: [[2, .3], [3, .25], [4, .3], [5, .2]],
            point: function (t, v, o) {
                var r = Math.cos(v[0] * t);
                o[0] = r * Math.cos(t);
                o[1] = r * Math.sin(t);
                o[2] = v[1] * Math.sin(2 * t);
            }
        },
        {
            key: 'lissajous', label: 'LISSAJOUS',
            variants: [[3, 2, 5], [1, 2, 3], [3, 4, 7], [2, 3, 4]],
            point: function (t, v, o) {
                o[0] = Math.sin(v[0] * t + .6);
                o[1] = Math.sin(v[1] * t);
                o[2] = .55 * Math.sin(v[2] * t + 1.1);
            }
        },
        {
            key: 'knot', label: 'KNOT',
            variants: [[2, 3], [3, 4], [2, 5], [3, 5]],
            point: function (t, v, o) {
                var r = .62 + .3 * Math.cos(v[1] * t);
                o[0] = r * Math.cos(v[0] * t);
                o[1] = r * Math.sin(v[0] * t);
                o[2] = .36 * Math.sin(v[1] * t);
            }
        }
    ];
}

function inkColor(hex, fallback) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    var n = parseInt(m ? m[1] : fallback.slice(1), 16);

    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function createArtEngine() {
    var CURVES = inkCurves();
    var DEPTH = 3, LAYERS = 4, BLUR = [0, 1, 2, 3], LAYER_GAIN = [1, .4, .17, .065], BLUR_SCALE = 4.4;
    var DETAIL = { Sparse: .6, Fine: 1, Dense: 1.55 };
    var WISP_POINTS = 12, KNOT_POINTS = 16, SHEET_POINTS = 52, SHEET_WIDTH = 18, RULE_POINTS = 260, RULE_SLOTS = 4;
    var settings = { paper: '#ffffff', ink: '#0c0c0f', detail: 'Fine' };
    var curve = 0, chaos = .45, focus = .5, pulse = .55;
    var seed = 9012, wisps = [], knots = [], sheets = [], rules = [];
    var paused = false, time = 0, fieldTime = 0, nextEvent = .8, ruleCursor = 0;
    var yaw = .5, pitch = -.28, yawNudge = 0, pitchNudge = 0, kick = 0;
    var width = 700, height = 440, R = 180, cx = 350, cy = 220, rot = [1, 0, 1, 0];
    var pull = { active: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, stamp: 0, started: 0 };
    var message = 'Drag to stir the ink. Tap to draw a rule and break it.';
    var layers = [], frame = { key: '', image: null, lut: null, lut32: null, little: true };
    var v1 = [0, 0, 0], v2 = [0, 0, 0], dir = [0, 0, 0], u = [0, 0, 0], w = [0, 0, 0];

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

    function perpendicular(a, o) {
        // A random unit vector orthogonal to a.
        direction(o);
        var d = o[0] * a[0] + o[1] * a[1] + o[2] * a[2];
        o[0] -= a[0] * d;
        o[1] -= a[1] * d;
        o[2] -= a[2] * d;
        var l = Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]) || 1;
        o[0] /= l;
        o[1] /= l;
        o[2] /= l;

        return o;
    }

    // Arnold-Beltrami-Childress flow: an exact, divergence-free rule whose streamlines are chaotic.
    function coarse(x, y, z, o) {
        var s = fieldTime * .13, X = x * 2.1 + s, Y = y * 2.1 - s * .7, Z = z * 2.1 + s * .4;
        o[0] = Math.sin(Z) + .61 * Math.cos(Y);
        o[1] = .82 * Math.sin(X) + Math.cos(Z);
        o[2] = .61 * Math.sin(Y) + .82 * Math.cos(X);
    }

    function fine(x, y, z, o) {
        var s = fieldTime * .37, X = x * 8.3 - s, Y = y * 8.3 + s * .6, Z = z * 8.3 + s * 1.3;
        o[0] = .9 * Math.sin(Y) + Math.cos(Z);
        o[1] = Math.sin(Z) + .7 * Math.cos(X);
        o[2] = .7 * Math.sin(X) + .9 * Math.cos(Y);
    }

    function makeStrand(kind, n) {
        var jit = new Float32Array(n * 3), gaps = new Uint8Array(n);

        for (var i = 0; i < n * 3; i++)
            jit[i] = gauss();

        for (i = 0; i < n; i++)
            gaps[i] = random() < .12 ? 1 : 0;

        return { kind: kind, n: n, jit: jit, gaps: gaps, p: new Float32Array(n * 3), s: new Float32Array(n * 4), o: [0, 0, 0], imp: [0, 0, 0], spin: [0, 0, 0], center: [0, 0, 0], age: 0, life: 1, weight: 1, lace: 0, ramp: 1, reveal: 1, alive: false };
    }

    function spawnWisp(s, strong) {
        // Core feathers: short radial streaks anchored to the knot of ink at the center.
        var c = s.o, len = (.04 + Math.pow(random(), 2) * .24) * (strong ? 1.6 : 1), bend = .15 + random() * .4;
        c[0] = gauss() * .025;
        c[1] = gauss() * .025;
        c[2] = gauss() * .025;
        direction(dir);
        perpendicular(dir, u);

        for (var j = 0; j < s.n; j++) {
            var t = j / (s.n - 1);
            s.p[j * 3] = c[0] + (dir[0] * t + u[0] * t * t * bend) * len;
            s.p[j * 3 + 1] = c[1] + (dir[1] * t + u[1] * t * t * bend) * len;
            s.p[j * 3 + 2] = c[2] + (dir[2] * t + u[2] * t * t * bend) * len;
        }

        var push = (.03 + random() * .12) * (strong ? 3.5 : 1);
        s.imp[0] = dir[0] * push;
        s.imp[1] = dir[1] * push;
        s.imp[2] = dir[2] * push;
        s.age = 0;
        s.life = 2.5 + random() * 5;
        s.weight = .3 + random() * .55;
        s.lace = .4 + random() * .6;
        s.alive = true;
    }

    function spawnKnot(s) {
        // The ink pool at the center: short, tightly tangled strands held close to the core.
        var c = s.o, r = .04 + random() * .07;
        c[0] = gauss() * .03;
        c[1] = gauss() * .03;
        c[2] = gauss() * .03;

        for (var j = 0; j < s.n; j++) {
            direction(dir);
            var t = j / (s.n - 1);
            s.p[j * 3] = c[0] + dir[0] * r * t;
            s.p[j * 3 + 1] = c[1] + dir[1] * r * t;
            s.p[j * 3 + 2] = c[2] + dir[2] * r * t;
        }

        s.imp[0] = s.imp[1] = s.imp[2] = 0;
        s.age = 0;
        s.life = 1.5 + random() * 3;
        s.weight = .5 + random() * .6;
        s.lace = 1;
        s.alive = true;
    }

    function spawnSheet(group) {
        // A small patch of parallel strands. Shear stretches it into a combed ribbon.
        var len = .2 + random() * .6, gap = .004 + random() * .007, life = 4 + random() * 7, weight = .32 + random() * .36;
        var lace = random() < .35 ? .7 + random() * .3 : random() * .3, ox = gauss() * .36, oy = gauss() * .36, oz = gauss() * .14;
        direction(dir);
        perpendicular(dir, u);
        perpendicular(dir, w);

        for (var i = 0; i < group.length; i++) {
            var s = group[i], offset = (i - (group.length - 1) / 2) * gap;

            for (var j = 0; j < s.n; j++) {
                var t = j / (s.n - 1) - .5, sag = (t * t * 4 - 1) * .18 * len;
                s.p[j * 3] = ox + dir[0] * len * t + u[0] * offset + w[0] * sag;
                s.p[j * 3 + 1] = oy + dir[1] * len * t + u[1] * offset + w[1] * sag;
                s.p[j * 3 + 2] = oz + dir[2] * len * t + u[2] * offset + w[2] * sag;
            }

            s.imp[0] = s.imp[1] = s.imp[2] = 0;
            s.age = 0;
            s.life = life;
            s.weight = weight;
            s.lace = lace;
            s.alive = true;
        }
    }

    function spawnRule(at) {
        // Precise rule: a closed curve, drawn crisp and spinning rigidly until chaos takes it.
        var s = rules[ruleCursor], c = CURVES[curve], variant = c.variants[Math.floor(random() * c.variants.length)];
        var scale = .32 + random() * .34;
        ruleCursor = (ruleCursor + 1) % rules.length;
        direction(dir);
        perpendicular(dir, u);
        w[0] = dir[1] * u[2] - dir[2] * u[1];
        w[1] = dir[2] * u[0] - dir[0] * u[2];
        w[2] = dir[0] * u[1] - dir[1] * u[0];

        for (var j = 0; j < s.n; j++) {
            c.point(j / s.n * Math.PI * 2, variant, v1);

            for (var k = 0; k < 3; k++)
                s.p[j * 3 + k] = at[k] + scale * (dir[k] * v1[0] + u[k] * v1[1] + w[k] * v1[2]);
        }

        direction(s.spin);
        var speed = .5 + random() * .9;
        s.spin[0] *= speed;
        s.spin[1] *= speed;
        s.spin[2] *= speed;
        s.center[0] = at[0];
        s.center[1] = at[1];
        s.center[2] = at[2];
        s.imp[0] = s.imp[1] = s.imp[2] = 0;
        s.age = 0;
        s.life = 2.6 + random() * 2.4;
        s.weight = 2;
        s.lace = .55 + random() * .45;
        s.ramp = 0;
        s.reveal = 0;
        s.alive = true;
    }

    function burst(at, strength) {
        // A pulse: everything near the point is shoved outward, and fresh feathers jet from the core.
        var groups = [wisps, knots, rules], g, i, j;
        kick = Math.min(.14, kick + .05 * strength);

        for (g = 0; g < sheets.length; g++)
            groups.push(sheets[g]);

        for (g = 0; g < groups.length; g++)
            for (i = 0; i < groups[g].length; i++) {
                var s = groups[g][i];

                if (!s.alive)
                    continue;

                var mx = s.p[0] - at[0], my = s.p[1] - at[1], mz = s.p[2] - at[2], d = Math.sqrt(mx * mx + my * my + mz * mz) + .05;

                if (d > .9)
                    continue;

                var f = strength * (.5 + random()) * (1 - d / .9) / d;
                s.imp[0] += mx * f;
                s.imp[1] += my * f;
                s.imp[2] += mz * f;
            }

        for (j = 0; j < wisps.length; j++)
            if (random() < .22 * strength)
                spawnWisp(wisps[j], true);
    }

    function event() {
        var r = random();

        if (r < .26) {
            v2[0] = gauss() * .08;
            v2[1] = gauss() * .08;
            v2[2] = gauss() * .08;
            spawnRule(v2);
        }
        else if (r < .8) {
            v2[0] = v2[1] = v2[2] = 0;
            burst(v2, .8 + random() * .6);
        }
        else {
            // A sudden shift of the field: the same rule, read from a different place.
            fieldTime += 1.5 + random() * 3;
            yaw += (random() - .5) * .5;
        }
    }

    function build() {
        var scale = DETAIL[settings.detail] || 1, i;
        wisps = [];
        knots = [];
        sheets = [];
        rules = [];

        for (i = 0; i < Math.round(320 * scale); i++) {
            wisps.push(makeStrand('wisp', WISP_POINTS));
            spawnWisp(wisps[i], false);
            wisps[i].age = random() * wisps[i].life * .8;
        }

        for (i = 0; i < Math.round(56 * scale); i++) {
            knots.push(makeStrand('knot', KNOT_POINTS));
            spawnKnot(knots[i]);
            knots[i].age = random() * knots[i].life;
        }

        for (i = 0; i < Math.round(20 * scale); i++) {
            var group = [];

            for (var k = 0; k < SHEET_WIDTH; k++)
                group.push(makeStrand('sheet', SHEET_POINTS));

            spawnSheet(group);

            for (k = 0; k < group.length; k++)
                group[k].age = group[0].life * random() * .6;

            sheets.push(group);
        }

        for (i = 0; i < RULE_SLOTS; i++)
            rules.push(makeStrand('rule', RULE_POINTS));
    }

    function envelope(s) {
        return Math.min(1, s.age / .5) * Math.min(1, (s.life - s.age) / 1.4);
    }

    function advance(s, dt, cyw, syw, cp, sp, reach2) {
        var precise = s.kind === 'rule' ? 1 - s.ramp : 0, level = s.kind === 'knot' ? .35 + chaos * .65 : chaos * (s.kind === 'rule' ? s.ramp : 1);
        var flowGain = (.07 + .5 * level) * (s.kind === 'wisp' ? .22 : s.kind === 'knot' ? .4 : 1), laceGain = level * s.lace * .5, decay = Math.exp(-1.4 * dt), p = s.p, scr = s.s;

        for (var j = 0; j < s.n; j++) {
            var a = j * 3, x = p[a], y = p[a + 1], z = p[a + 2], reachOut = s.kind === 'wisp' ? j / (s.n - 1) : 1;
            coarse(x, y, z, v1);
            var vx = v1[0] * flowGain + s.imp[0] * reachOut, vy = v1[1] * flowGain + s.imp[1] * reachOut, vz = v1[2] * flowGain + s.imp[2] * reachOut;

            if (laceGain > .002) {
                fine(x, y, z, v2);
                vx += v2[0] * laceGain;
                vy += v2[1] * laceGain;
                vz += v2[2] * laceGain;
            }

            // Keep the ink in frame: a gentle pull home that stiffens near the edge.
            var r = Math.sqrt(x * x + y * y + z * z), home = .07 + Math.max(0, r - 1.25) * 2.5;
            vx -= x * home;
            vy -= y * home;
            vz -= z * home;

            if (precise > 0) {
                var dx = x - s.center[0], dy = y - s.center[1], dz = z - s.center[2];
                vx += (s.spin[1] * dz - s.spin[2] * dy) * precise;
                vy += (s.spin[2] * dx - s.spin[0] * dz) * precise;
                vz += (s.spin[0] * dy - s.spin[1] * dx) * precise;
            }

            if (s.kind === 'knot') {
                vx += (s.o[0] - x) * 3.2;
                vy += (s.o[1] - y) * 3.2;
                vz += (s.o[2] - z) * 3.2;
            }

            if (s.kind === 'wisp' && j === 0) {
                vx += (s.o[0] - x) * 5;
                vy += (s.o[1] - y) * 5;
                vz += (s.o[2] - z) * 5;
            }

            if (pull.active) {
                var sx = pull.x - scr[j * 4], sy = pull.y - scr[j * 4 + 1], d2 = sx * sx + sy * sy;

                if (d2 < reach2) {
                    // Stir: ink near the pointer takes its motion and swirls around it.
                    var held = 1 - Math.sqrt(d2 / reach2), k = held / scr[j * 4 + 3];
                    var mx = (pull.vx * .8 - sy * 2.2) * k, my = (pull.vy * .8 + sx * 2.2) * k, z1 = -sp * my;
                    vx += cyw * mx - syw * z1;
                    vy += cp * my;
                    vz += syw * mx + cyw * z1;
                }
            }

            p[a] = x + vx * dt;
            p[a + 1] = y + vy * dt;
            p[a + 2] = z + vz * dt;
        }

        s.imp[0] *= decay;
        s.imp[1] *= decay;
        s.imp[2] *= decay;
    }

    function step(dt) {
        var i, g, s;
        time += dt;
        fieldTime += dt * (.5 + chaos);
        kick *= Math.exp(-2.5 * dt);
        yaw += .07 * dt;
        pitch = -.28 + Math.sin(time * .11) * .14;
        projectBasis();
        var reach = Math.min(width, height) * .22;

        if (pulse > 0) {
            nextEvent -= dt;

            if (nextEvent <= 0) {
                event();
                nextEvent = (.45 + random() * 1.3) * (1.7 - pulse * 1.35);
            }
        }

        for (i = 0; i < wisps.length; i++) {
            s = wisps[i];
            s.age += dt;

            if (s.age > s.life)
                spawnWisp(s, false);

            advance(s, dt, rot[0], rot[1], rot[2], rot[3], reach * reach);
        }

        for (i = 0; i < knots.length; i++) {
            s = knots[i];
            s.age += dt;

            if (s.age > s.life)
                spawnKnot(s);

            advance(s, dt, rot[0], rot[1], rot[2], rot[3], reach * reach);
        }

        for (g = 0; g < sheets.length; g++) {
            if (sheets[g][0].age + dt > sheets[g][0].life)
                spawnSheet(sheets[g]);

            for (i = 0; i < sheets[g].length; i++) {
                sheets[g][i].age += dt;
                advance(sheets[g][i], dt, rot[0], rot[1], rot[2], rot[3], reach * reach);
            }
        }

        for (i = 0; i < rules.length; i++) {
            s = rules[i];

            if (!s.alive)
                continue;

            s.age += dt;

            if (s.age > s.life) {
                s.alive = false;
                continue;
            }

            s.reveal = Math.min(1, s.reveal + dt * 3.2);

            if (s.reveal >= 1 && s.age > .55)
                s.ramp = Math.min(1, s.ramp + dt * (.15 + chaos * 1.1));

            advance(s, dt, rot[0], rot[1], rot[2], rot[3], reach * reach);
        }
    }

    function projectBasis() {
        rot[0] = Math.cos(yaw + yawNudge);
        rot[1] = Math.sin(yaw + yawNudge);
        rot[2] = Math.cos(pitch + pitchNudge);
        rot[3] = Math.sin(pitch + pitchNudge);
    }

    function project(s) {
        // Crumple: a fixed per-point offset that grows with chaos, so lace reads wrinkled rather than smooth.
        var cyw = rot[0], syw = rot[1], cp = rot[2], sp = rot[3], p = s.p, scr = s.s, jit = s.jit;
        var crumple = s.lace * (s.kind === 'rule' ? s.ramp : 1) * (.002 + chaos * .007);

        for (var j = 0; j < s.n; j++) {
            var x = p[j * 3] + jit[j * 3] * crumple, y = p[j * 3 + 1] + jit[j * 3 + 1] * crumple, z = p[j * 3 + 2] + jit[j * 3 + 2] * crumple;
            var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, k = DEPTH / (DEPTH + z2) * R;
            scr[j * 4] = cx + x1 * k;
            scr[j * 4 + 1] = cy + y2 * k;
            scr[j * 4 + 2] = z2;
            scr[j * 4 + 3] = k;
        }
    }

    function screenToWorld(x, y, o) {
        var a = (x - cx) / R, b = (y - cy) / R, z1 = -b * rot[3];
        o[0] = a * rot[0] - z1 * rot[1];
        o[1] = b * rot[2];
        o[2] = a * rot[1] + z1 * rot[0];

        return o;
    }

    function ensureLayers(bw, bh, ctx) {
        var key = bw + 'x' + bh;

        if (frame.key === key)
            return;

        frame.key = key;
        layers = [];

        for (var L = 0; L < LAYERS; L++) {
            var lw = Math.max(1, Math.ceil(bw / (1 << L))), lh = Math.max(1, Math.ceil(bh / (1 << L)));
            layers.push({ w: lw, h: lh, d: new Float32Array(lw * lh), tmp: new Float32Array(Math.max(lw, lh)), up: null });
        }

        // Bilinear 2x upsampling tables, from each layer into the next finer one.
        for (L = LAYERS - 1; L > 0; L--) {
            var src = layers[L], dst = layers[L - 1], xs = new Int32Array(dst.w * 2), xt = new Float32Array(dst.w), ys = new Int32Array(dst.h * 2), yt = new Float32Array(dst.h);
            axis(dst.w, src.w, xs, xt);
            axis(dst.h, src.h, ys, yt);
            src.up = { xs: xs, xt: xt, ys: ys, yt: yt };
        }

        frame.image = ctx.createImageData(bw, bh);
        var data = frame.image.data;
        frame.u32 = data && data.buffer && typeof Uint32Array !== 'undefined' && data.length === bw * bh * 4 ? new Uint32Array(data.buffer, data.byteOffset || 0, bw * bh) : null;
        frame.lut = null;
    }

    function axis(dn, sn, idx, frac) {
        for (var i = 0; i < dn; i++) {
            var f = (i + .5) / 2 - .5, a = Math.floor(f), t = f - a;

            if (a < 0) {
                a = 0;
                t = 0;
            }

            idx[i * 2] = Math.min(a, sn - 1);
            idx[i * 2 + 1] = Math.min(a + 1, sn - 1);
            frac[i] = t;
        }
    }

    function makeLut() {
        var paper = inkColor(settings.paper, '#ffffff'), ink = inkColor(settings.ink, '#0c0c0f'), lut = new Uint8Array(1024 * 3), lut32 = new Uint32Array(1024);
        var probe = new Uint8Array(new Uint32Array([0x0a0b0c0d]).buffer);
        frame.little = probe[0] === 0x0d;

        for (var i = 0; i < 1024; i++) {
            var a = 1 - Math.exp(-i / 96 * 1.15), r = Math.round(paper[0] + (ink[0] - paper[0]) * a), g = Math.round(paper[1] + (ink[1] - paper[1]) * a), b = Math.round(paper[2] + (ink[2] - paper[2]) * a);
            lut[i * 3] = r;
            lut[i * 3 + 1] = g;
            lut[i * 3 + 2] = b;
            lut32[i] = frame.little ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0 : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
        }

        frame.lut = lut;
        frame.lut32 = lut32;
    }

    function splat(layer, x0, y0, x1, y1, weight) {
        // Antialiased line into a density buffer: each step splits its ink across two pixels.
        var buf = layer.d, bw = layer.w, bh = layer.h, dx = x1 - x0, dy = y1 - y0, adx = Math.abs(dx), ady = Math.abs(dy), n = Math.ceil(Math.max(adx, ady));

        if (n < 1)
            n = 1;

        if (n > 1200)
            return;

        var sx = dx / n, sy = dy / n, wgt = weight * Math.sqrt(dx * dx + dy * dy) / n, x = x0, y = y0, i, a, b, f, q;

        if (wgt <= 0)
            wgt = weight * .5;

        if (adx >= ady) {
            for (i = 0; i < n; i++, x += sx, y += sy) {
                a = Math.floor(x);

                if (a < 0 || a >= bw)
                    continue;

                q = y - .5;
                b = Math.floor(q);
                f = q - b;

                if (b >= 0 && b < bh)
                    buf[b * bw + a] += wgt * (1 - f);

                if (b + 1 >= 0 && b + 1 < bh)
                    buf[(b + 1) * bw + a] += wgt * f;
            }
        }
        else {
            for (i = 0; i < n; i++, x += sx, y += sy) {
                b = Math.floor(y);

                if (b < 0 || b >= bh)
                    continue;

                q = x - .5;
                a = Math.floor(q);
                f = q - a;

                if (a >= 0 && a < bw)
                    buf[b * bw + a] += wgt * (1 - f);

                if (a + 1 >= 0 && a + 1 < bw)
                    buf[b * bw + a + 1] += wgt * f;
            }
        }
    }

    function deposit(s, base, closed, taper) {
        // Each segment's ink is shared between the two depth-of-field layers either side of its blur.
        var scr = s.s, focal = (focus - .5) * 1.7, count = s.kind === 'rule' ? Math.floor(s.n * s.reveal) : s.n, limit = R * .45;
        var last = count + (closed && count === s.n ? 1 : 0);

        var broken = (s.kind === 'knot' || s.kind === 'rule') && s.lace > .5 && (s.kind !== 'rule' || s.ramp > .5);

        for (var j = 1; j < last; j++) {
            if (broken && s.gaps[j % s.n])
                continue;

            var a = (j - 1) * 4, b = (j % s.n) * 4, x0 = scr[a], y0 = scr[a + 1], x1 = scr[b], y1 = scr[b + 1];
            var gx = x1 - x0, gy = y1 - y0;

            if (gx * gx + gy * gy > limit * limit)
                continue;

            var depth = (scr[a + 2] + scr[b + 2]) * .5, level = Math.min(LAYERS - 1.001, Math.abs(depth - focal) * BLUR_SCALE), L = Math.floor(level), f = level - L;
            // Ink right in front of the lens fades out instead of smearing across the frame.
            var near = Math.max(0, Math.min(1, (DEPTH + depth - 1) / .9));
            var ink = base * near * (taper ? 2 * Math.pow(1 - (j - 1) / last, 1.6) : 1);

            if (ink <= 0)
                continue;

            if (f < .98) {
                var k0 = frame.ratio / (1 << L);
                splat(layers[L], x0 * k0, y0 * k0, x1 * k0, y1 * k0, ink * LAYER_GAIN[L] * (1 - f));
            }

            if (f > .02) {
                var k1 = frame.ratio / (1 << (L + 1));
                splat(layers[L + 1], x0 * k1, y0 * k1, x1 * k1, y1 * k1, ink * LAYER_GAIN[L + 1] * f);
            }
        }
    }

    function blur(layer, r) {
        // Two passes of a separable box blur: close to Gaussian, linear time.
        var d = layer.d, w = layer.w, h = layer.h, t = layer.tmp, norm = 1 / (2 * r + 1), pass, x, y, sum;

        for (pass = 0; pass < 2; pass++) {
            for (y = 0; y < h; y++) {
                var row = y * w;
                sum = 0;

                for (x = 0; x < w; x++)
                    t[x] = d[row + x];

                for (x = 0; x < r && x < w; x++)
                    sum += t[x];

                for (x = 0; x < w; x++) {
                    if (x + r < w)
                        sum += t[x + r];

                    d[row + x] = sum * norm;

                    if (x - r >= 0)
                        sum -= t[x - r];
                }
            }

            for (x = 0; x < w; x++) {
                sum = 0;

                for (y = 0; y < h; y++)
                    t[y] = d[y * w + x];

                for (y = 0; y < r && y < h; y++)
                    sum += t[y];

                for (y = 0; y < h; y++) {
                    if (y + r < h)
                        sum += t[y + r];

                    d[y * w + x] = sum * norm;

                    if (y - r >= 0)
                        sum -= t[y - r];
                }
            }
        }
    }

    function soften(layer) {
        // Out-of-focus ink saturates at a mid gray, the way a defocused stroke never reads solid black.
        var d = layer.d, cap = .55;

        for (var i = 0; i < d.length; i++)
            d[i] = cap * d[i] / (cap + d[i]);
    }

    function upsampleInto(src, dst) {
        var up = src.up, s = src.d, d = dst.d, sw = src.w;

        for (var y = 0; y < dst.h; y++) {
            var r0 = up.ys[y * 2] * sw, r1 = up.ys[y * 2 + 1] * sw, ty = up.yt[y], row = y * dst.w;

            for (var x = 0; x < dst.w; x++) {
                var a = up.xs[x * 2], b = up.xs[x * 2 + 1], tx = up.xt[x];
                var top = s[r0 + a] + (s[r0 + b] - s[r0 + a]) * tx, bottom = s[r1 + a] + (s[r1 + b] - s[r1 + a]) * tx;
                d[row + x] += top + (bottom - top) * ty;
            }
        }
    }

    function composite(ctx, bw, bh) {
        var d = layers[0].d, n = bw * bh, i, v;

        if (!frame.lut)
            makeLut();

        if (frame.u32) {
            var out = frame.u32, lut32 = frame.lut32;

            for (i = 0; i < n; i++) {
                v = (d[i] * 96) | 0;
                out[i] = lut32[v > 1023 ? 1023 : v];
            }
        }
        else {
            var data = frame.image.data, lut = frame.lut;

            for (i = 0; i < n; i++) {
                v = (d[i] * 96) | 0;
                v = (v > 1023 ? 1023 : v) * 3;
                data[i * 4] = lut[v];
                data[i * 4 + 1] = lut[v + 1];
                data[i * 4 + 2] = lut[v + 2];
                data[i * 4 + 3] = 255;
            }
        }

        ctx.putImageData(frame.image, 0, 0);
    }

    function draw(ctx, w, h, ratio) {
        var bw = Math.max(8, Math.round(w * ratio)), bh = Math.max(8, Math.round(h * ratio)), i, g, s;
        frame.ratio = bw / w;
        ensureLayers(bw, bh, ctx);
        R = Math.min(w, h) * .6 * (1 + kick);
        cx = w / 2;
        cy = h / 2;
        projectBasis();

        for (i = 0; i < LAYERS; i++)
            layers[i].d.fill(0);

        for (i = 0; i < wisps.length; i++) {
            s = wisps[i];
            project(s);
            deposit(s, s.weight * envelope(s) * .6, false, true);
        }

        for (i = 0; i < knots.length; i++) {
            s = knots[i];
            project(s);
            deposit(s, s.weight * envelope(s) * 1.7, false, false);
        }

        for (g = 0; g < sheets.length; g++)
            for (i = 0; i < sheets[g].length; i++) {
                s = sheets[g][i];
                project(s);
                deposit(s, s.weight * envelope(s) * .5, false, false);
            }

        for (i = 0; i < rules.length; i++) {
            s = rules[i];

            if (!s.alive)
                continue;

            project(s);
            deposit(s, s.weight * (1 - .72 * s.ramp) * Math.min(1, (s.life - s.age) / 1.6), true, false);
        }

        for (i = LAYERS - 1; i > 0; i--) {
            blur(layers[i], BLUR[i]);
            soften(layers[i]);
            upsampleInto(layers[i], layers[i - 1]);
        }

        composite(ctx, bw, bh);
    }

    function describe() {
        var tone = chaos < .08 ? 'precise' : chaos < .45 ? 'restless' : chaos < .8 ? 'unruly' : 'feral';

        return 'Rule ' + CURVES[curve].label.toLowerCase() + ', chaos ' + Math.round(chaos * 100) + ': ' + tone + '.';
    }

    function reseed() {
        seed = (seed * 31 + 7) | 0;
        time = 0;
        nextEvent = .4;
        build();
        v2[0] = v2[1] = v2[2] = 0;
        spawnRule(v2);

        for (var n = 0; n < 45; n++)
            step(.033);
    }

    reseed();

    var api = {
        meta: { title: 'STOCHASTIC INK', brand: 'CHALDEA // INK STUDY', hint: 'Drag to stir the ink. Tap to draw a rule and break it. Arrow keys turn the view.' },
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
                { type: 'select', key: 'rule', label: 'RULE', value: CURVES[curve].key, options: CURVES.map(function (c) { return { value: c.key, label: c.label }; }) },
                { type: 'range', key: 'chaos', label: 'CHAOS', value: Math.round(chaos * 100), min: 0, max: 100, step: 1 },
                { type: 'range', key: 'focus', label: 'FOCUS', value: Math.round(focus * 100), min: 0, max: 100, step: 1 },
                { type: 'range', key: 'pulse', label: 'PULSE', value: Math.round(pulse * 100), min: 0, max: 100, step: 1 },
                { type: 'button', key: 'draw', label: 'DRAW RULE' },
                { type: 'button', key: 'burst', label: 'BURST' },
                { type: 'button', key: 'reseed', label: 'RESEED' }
            ];
        },
        action: function (key, value) {
            if (key === 'rule') {
                for (var i = 0; i < CURVES.length; i++)
                    if (CURVES[i].key === value)
                        curve = i;

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

            if (key === 'pulse') {
                pulse = Math.max(0, Math.min(100, Number(value))) / 100;
                message = pulse === 0 ? 'Pulse off. Rules appear only when you draw them.' : 'Pulse ' + Math.round(pulse * 100) + '.';
            }

            if (key === 'draw') {
                v2[0] = v2[1] = v2[2] = 0;
                spawnRule(v2);
                message = 'A ' + CURVES[curve].label.toLowerCase() + ' drawn. Chaos will take it apart.';
            }

            if (key === 'burst') {
                v2[0] = v2[1] = v2[2] = 0;
                burst(v2, 1.3);
                message = 'Burst. The ink blooms out from the core.';
            }

            if (key === 'reseed') {
                reseed();
                message = 'Reseeded. Fresh ink, same rules.';
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

                if (!pull.moved && stamp - pull.started < 450) {
                    screenToWorld(pull.sx, pull.sy, v2);
                    spawnRule(v2);
                    burst(v2, .7);
                    message = 'A ' + CURVES[curve].label.toLowerCase() + ' drawn where you tapped.';
                }
                else
                    message = 'Ink stirred. The flow carries it on.';
            }

            if (kind === 'leave' || kind === 'cancel')
                pull.active = false;

            if (pull.active && pull.moved)
                message = 'Stirring the ink.';
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
                api.action('draw');

            if (name === 'Escape')
                api.suspend();
        },
        configure: function (value) {
            var rebuild = false;

            for (var key in value)
                if (Object.prototype.hasOwnProperty.call(settings, key) && value[key] !== undefined && value[key] !== null) {
                    if (key === 'detail' && settings.detail !== String(value[key]))
                        rebuild = true;

                    settings[key] = String(value[key]);
                }

            frame.lut = null;

            if (rebuild) {
                build();
                v2[0] = v2[1] = v2[2] = 0;
                spawnRule(v2);
            }
        },
        needsMotion: function () {
            return true;
        },
        // ratio: buffer pixels per logical pixel. The host sizes its canvas to round(w * ratio) by round(h * ratio).
        render: function (ctx, w, h, elapsed, ratio) {
            width = w;
            height = h;
            var dt = paused ? 0 : Math.min(.05, Math.max(0, elapsed || 0));

            if (dt)
                step(dt);

            draw(ctx, w, h, ratio || 1);
        },
        status: function () {
            return message;
        },
        suspend: function () {
            pull.active = false;
        },
        inspect: function () {
            var points = wisps.length * WISP_POINTS + knots.length * KNOT_POINTS + sheets.length * SHEET_WIDTH * SHEET_POINTS + rules.length * RULE_POINTS;

            return { time: time, paused: paused, points: points, rule: CURVES[curve].key, chaos: chaos, focus: focus, pulse: pulse, liveRules: rules.filter(function (s) { return s.alive; }).length, pulling: pull.active };
        }
    };

    return api;
}
