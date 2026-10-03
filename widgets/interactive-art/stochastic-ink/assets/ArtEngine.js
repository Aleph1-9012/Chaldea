// SPDX-License-Identifier: 0BSD
// Stochastic ink: the scene shared by the browser preview and the native QML host.
//
// Precise rules: smooth rays from a dark core, closed loops (rose, Lissajous, torus knot), and
// shells of arcs, each sampled as hundreds of points. Stochastic chaos: noise that grows along
// each line after it is drawn, turning it into a beaded chain before it fades. A beat redraws
// lines clean. Every point is blurred by its own distance from the focal plane, and ink adds up
// as density, so out-of-focus ink becomes pale smoke while the focal plane stays sharp.
//
// This file runs the scene (which lines exist, their shapes, envelopes, and the camera) and
// writes it into a small table. The GPU program in INK_SHADER_CORE places and blurs every point.
// Keep it ES2016-compatible for Qt's JavaScript engine: no object spread or optional chaining.

var INK_TEXELS = 6;
// Line slots by kind. Each slot owns a fixed run of points; long curves get more so they stay continuous.
var INK_GROUPS = [
    { kind: 'cloud', lines: 24, points: 512 },
    { kind: 'loop', lines: 12, points: 2048 },
    { kind: 'arc', lines: 40, points: 1024 },
    { kind: 'sheet', lines: 16, points: 4096 },
    { kind: 'ray', lines: 140, points: 768 }
];
var INK_LINES = INK_GROUPS.reduce(function (n, g) { return n + g.lines; }, 0);

// Shared GPU code. Hosts add their own version line, inputs, and outputs around it.
var INK_SHADER_CORE = [
    'uvec3 inkPcg(uvec3 v) {',
    '    v = v * 1664525u + 1013904223u;',
    '    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;',
    '    v ^= v >> 16u;',
    '    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;',
    '    return v;',
    '}',
    'vec3 inkHash(vec3 c) {',
    '    uvec3 h = inkPcg(uvec3(ivec3(c) + 8192));',
    '    return vec3(h >> 8u) * (2.0 / 16777216.0) - 1.0;',
    '}',
    '// Vector value noise in [-1, 1], smooth in all three components.',
    'vec3 inkNoise(vec3 p) {',
    '    vec3 i = floor(p), f = p - i, u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
    '    vec3 a = mix(inkHash(i), inkHash(i + vec3(1.0, 0.0, 0.0)), u.x);',
    '    vec3 b = mix(inkHash(i + vec3(0.0, 1.0, 0.0)), inkHash(i + vec3(1.0, 1.0, 0.0)), u.x);',
    '    vec3 c = mix(inkHash(i + vec3(0.0, 0.0, 1.0)), inkHash(i + vec3(1.0, 0.0, 1.0)), u.x);',
    '    vec3 d = mix(inkHash(i + vec3(0.0, 1.0, 1.0)), inkHash(i + vec3(1.0, 1.0, 1.0)), u.x);',
    '    return mix(mix(a, b, u.y), mix(c, d, u.y), u.z);',
    '}',
    '// One point of line li at parameter s, before noise. prof scales the noise along the line.',
    'vec3 inkCurve(vec4 h, vec4 c, vec4 A, vec4 B, vec4 C, float extra, float s, vec3 rnd, out float prof) {',
    '    prof = 1.0;',
    '    if (h.x < 1.5) {',
    '        // Ray from the core: straight, bent, and gently waved. Noise grows toward the tip.',
    '        prof = 0.12 + 0.88 * s;',
    '        return c.xyz + A.xyz * (c.w * s) + B.xyz * (c.w * A.w * s * s) + C.xyz * (c.w * B.w * s * sin(s * C.w + h.y));',
    '    }',
    '    if (h.x < 2.5) {',
    '        // Closed loop: rose, Lissajous, or torus knot.',
    '        float th = 6.2831853 * s;',
    '        vec3 q;',
    '        if (h.y < 0.5) { float r = cos(A.w * th); q = vec3(r * cos(th), r * sin(th), B.w * sin(2.0 * th)); }',
    '        else if (h.y < 1.5) q = vec3(sin(A.w * th + 0.6), sin(B.w * th), 0.55 * sin(C.w * th + 1.1));',
    '        else { float r = 0.62 + 0.3 * cos(B.w * th); q = vec3(r * cos(A.w * th), r * sin(A.w * th), 0.36 * sin(B.w * th)); }',
    '        return c.xyz + c.w * (A.xyz * q.x + B.xyz * q.y + C.xyz * q.z);',
    '    }',
    '    if (h.x < 3.5) {',
    '        // Arc of a shell around the core.',
    '        float ph = A.w + B.w * s;',
    '        return c.xyz + c.w * (A.xyz * cos(ph) + B.xyz * sin(ph) + C.xyz * (C.w * sin(ph * 2.0 + h.y)));',
    '    }',
    '    if (h.x < 4.5) {',
    '        // Cloud of ink dust: denser toward its center.',
    '        float z = rnd.x * 2.0 - 1.0, a = 6.2831853 * rnd.y, r = sqrt(max(0.0, 1.0 - z * z));',
    '        float rad = c.w * sqrt(-log(1.0 - 0.985 * rnd.z)) * 0.55;',
    '        return c.xyz + vec3(r * cos(a), r * sin(a), z) * rad;',
    '    }',
    '    // Sheet: a bulging, twisting patch drawn as rows of parallel strands, combed like fabric.',
    '    // Nets also draw some strands across the rows, which reads as a wing-like lattice.',
    '    // Points come in contiguous runs, one run per strand, so every strand is evenly sampled.',
    '    float u, v, rows = C.w, net = B.w;',
    '    if (s < 1.0 - net) { float t = s / (1.0 - net) * rows; v = (floor(t) + 0.5) / rows; u = fract(t); }',
    '    else { float cols = max(1.0, floor(rows * 0.6)), t = (s - 1.0 + net) / net * cols; u = (floor(t) + 0.5) / cols; v = fract(t); }',
    '    float tw = h.y * (u - 0.5), cu = u - 0.5, cv = v - 0.5;',
    '    vec3 side = B.xyz * cos(tw) + C.xyz * sin(tw);',
    '    // Pinched at the core end and spread toward the tip, like a fan.',
    '    return c.xyz + c.w * (A.xyz * cu + side * (extra * cv * (0.15 + 1.7 * u)) + C.xyz * (A.w * (cu * cu * 4.0 + cv * cv * 2.0 - 1.0)));',
    '}',
    '// A finished point: the curve, then chaos (three octaves of noise, mostly across the line',
    '// so ink crinkles instead of bunching into beads), then a slow drift shared by everything.',
    'vec3 inkPoint(vec4 h, vec4 c, vec4 A, vec4 B, vec4 C, vec4 n, float s, vec3 rnd, float time, float drift) {',
    '    float prof, unused;',
    '    vec3 p = inkCurve(h, c, A, B, C, n.w, s, rnd, prof);',
    '    vec3 q = p * n.y + vec3(n.z, n.z * 1.7, n.z * 2.3) + vec3(0.0, 0.0, time * 1.3);',
    '    vec3 d = inkNoise(q) + 0.5 * inkNoise(q * 2.13 + 11.7) + 0.3 * inkNoise(q * 4.71 - 5.3);',
    '    if (h.x < 3.5) {',
    '        vec3 t = inkCurve(h, c, A, B, C, n.w, s + 0.003, rnd, unused) - p;',
    '        float l = length(t);',
    '        if (l > 1e-6) { t /= l; d -= t * (dot(d, t) * 0.8); }',
    '    }',
    '    p += d * (n.x * prof);',
    '    return p + inkNoise(p * 0.85 + vec3(time * 0.06, 3.1, 7.7)) * drift;',
    '}'
].join('\n');

function inkColor(hex, fallback) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    var n = parseInt(m ? m[1] : fallback.slice(1), 16);

    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Per-point inputs, fixed for the life of the component: (line, s, r1, r2) and (r3, r4, r5, r6).
function inkPointData() {
    var n = INK_GROUPS.reduce(function (t, g) { return t + g.lines * g.points; }, 0), a = new Float32Array(n * 4), b = new Float32Array(n * 4), seed = 77;

    function random() {
        seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    var i = 0, line = 0;

    INK_GROUPS.forEach(function (g) {
        for (var l = 0; l < g.lines; l++, line++)
            for (var j = 0; j < g.points; j++, i++) {
                a[i * 4] = line;
                a[i * 4 + 1] = Math.min(1, Math.max(0, (j + .5 + (random() - .5) * .9) / g.points));
                a[i * 4 + 2] = random();
                a[i * 4 + 3] = random();

                for (var k = 0; k < 4; k++)
                    b[i * 4 + k] = random();
            }
    });

    return { line: a, random: b, count: n };
}

function createArtEngine() {
    var CURVES = [
        { key: 'rose', label: 'ROSE', variants: [[2, .3, 0], [3, .25, 0], [4, .3, 0], [5, .2, 0]] },
        { key: 'lissajous', label: 'LISSAJOUS', variants: [[3, 2, 5], [1, 2, 3], [3, 4, 7], [2, 3, 4]] },
        { key: 'knot', label: 'KNOT', variants: [[2, 3, 0], [3, 4, 0], [2, 5, 0], [3, 5, 0]] }
    ];
    var RAY = 1, LOOP = 2, ARC = 3, CLOUD = 4, SHEET = 5;
    var SLOTS = {}, first = 0;

    INK_GROUPS.forEach(function (g) {
        SLOTS[g.kind] = [first, first + g.lines];
        first += g.lines;
    });

    var KEEP = { Sparse: .55, Fine: .85, Dense: 1 };
    var settings = { paper: '#ffffff', ink: '#0c0c0f', detail: 'Fine' };
    var curve = 0, chaos = .5, focus = .5, pulse = .55;
    var seed = 9012, time = 0, paused = false, nextBeat = .25, beats = 0;
    var cam = { yaw: .6, pitch: -.22, dist: 2.75, dragYaw: 0, dragPitch: 0, target: [0, 0, 0], eye: [0, 0, 3] };
    var pull = { active: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, started: 0 };
    var message = 'Drag to turn the view. Tap to strike a beat.';
    var lines = [], table = new Float32Array(INK_LINES * INK_TEXELS * 4);
    var view = new Float32Array(16), proj = new Float32Array(16);
    var d0 = [0, 0, 0], e0 = [0, 0, 0], f0 = [0, 0, 0];

    for (var i = 0; i < INK_LINES; i++)
        lines.push({ type: 0, family: 0, alive: false, length: 1, extra: 0, c: [0, 0, 0], scale: 1, A: [1, 0, 0], B: [0, 1, 0], C: [0, 0, 1], p: [0, 0, 0], weight: 1, birth: 0, life: 1, fadeIn: .1, rampFrom: 0, startFrac: 1, ramp: 1, ampScale: 0, freq: 10, nseed: 0 });

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

    function unit(o) {
        var z = random() * 2 - 1, a = random() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        o[0] = Math.cos(a) * r;
        o[1] = Math.sin(a) * r;
        o[2] = z;

        return o;
    }

    function normalize(o) {
        var l = Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]) || 1;
        o[0] /= l;
        o[1] /= l;
        o[2] /= l;

        return o;
    }

    function cross(a, b, o) {
        var x = a[1] * b[2] - a[2] * b[1], y = a[2] * b[0] - a[0] * b[2], z = a[0] * b[1] - a[1] * b[0];
        o[0] = x;
        o[1] = y;
        o[2] = z;

        return o;
    }

    function frame(a, b, c) {
        // A random orthonormal frame with a as its first axis.
        unit(b);
        var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        b[0] -= a[0] * d;
        b[1] -= a[1] * d;
        b[2] -= a[2] * d;
        normalize(b);
        cross(a, b, c);
    }

    function smooth(e0, e1, x) {
        var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));

        return t * t * (3 - 2 * t);
    }

    function claim(range) {
        // A free slot in the range, or else the line closest to the end of its life.
        var best = range[0], score = -1;

        for (var i = range[0]; i < range[1]; i++) {
            var l = lines[i];

            if (!l.alive)
                return l;

            var s = (time - l.birth) / l.life;

            if (s > score) {
                score = s;
                best = i;
            }
        }

        return lines[best];
    }

    function begin(l, type, life, precise) {
        l.type = type;
        l.alive = true;
        l.birth = time;
        l.life = life;
        l.rampFrom = time;
        l.startFrac = precise ? 0 : 1;
        l.ramp = (.6 - .42 * chaos) * (.6 + random() * .8);
        l.fadeIn = precise ? .05 + random() * .08 : .3 + random() * .5;
        l.nseed = random() * 100;
    }

    function copy(src, dst) {
        dst[0] = src[0];
        dst[1] = src[1];
        dst[2] = src[2];
    }

    function rayBundle(precise) {
        // A fan of rays leaving the core together: one direction, spread across a few degrees.
        var n = random() < .3 ? 1 + Math.floor(random() * 2) : 3 + Math.floor(random() * 12);
        var short = random() < .55, spread = (.03 + random() * .3) * (n > 2 ? 1 : .2), len = short ? .08 + random() * .32 : .4 + Math.pow(random(), 1.3) * .85;
        var bend = (random() - .5) * .9, wave = random() < .5 ? random() * .03 : 0, waveFreq = 6 + random() * 26;
        var life = 1.6 + random() * 3.5, freq = 8 + random() * 16, weight = (.5 + random() * .6) * 1.25 / Math.sqrt(n);
        unit(d0);
        frame(d0, e0, f0);

        for (var k = 0; k < n; k++) {
            var l = claim(SLOTS.ray), t = n > 1 ? k / (n - 1) - .5 : 0;
            begin(l, RAY, life * (.85 + random() * .3), precise);
            l.c[0] = gauss() * .012;
            l.c[1] = gauss() * .012;
            l.c[2] = gauss() * .012;
            l.A[0] = d0[0] + e0[0] * t * spread * 2 + gauss() * .01;
            l.A[1] = d0[1] + e0[1] * t * spread * 2 + gauss() * .01;
            l.A[2] = d0[2] + e0[2] * t * spread * 2 + gauss() * .01;
            normalize(l.A);
            frame(l.A, l.B, l.C);
            // Bend the whole fan the same way.
            var d = f0[0] * l.A[0] + f0[1] * l.A[1] + f0[2] * l.A[2];
            l.B[0] = f0[0] - l.A[0] * d;
            l.B[1] = f0[1] - l.A[1] * d;
            l.B[2] = f0[2] - l.A[2] * d;
            normalize(l.B);
            cross(l.A, l.B, l.C);
            l.scale = len * (.9 + random() * .2);
            l.length = l.scale;
            l.p[0] = bend * (.85 + random() * .3);
            l.p[1] = wave;
            l.p[2] = waveFreq;
            l.family = random() * 6.28;
            l.weight = weight;
            l.ampScale = .055 * (.6 + random() * .8);
            l.freq = freq;
        }
    }

    function loop(precise, at) {
        var l = claim(SLOTS.loop), c = CURVES[curve], v = c.variants[Math.floor(random() * c.variants.length)];
        begin(l, LOOP, 1.4 + random() * 2.2, precise);
        l.family = curve;
        l.c[0] = (at ? at[0] : 0) + gauss() * .03;
        l.c[1] = (at ? at[1] : 0) + gauss() * .03;
        l.c[2] = (at ? at[2] : 0) + gauss() * .03;
        unit(l.A);
        frame(l.A, l.B, l.C);
        l.scale = .14 + random() * .3;
        l.length = l.scale * 8;
        l.p[0] = v[0];
        l.p[1] = v[1];
        l.p[2] = v[2];
        l.weight = .45 + random() * .3;
        l.ampScale = .045 * (.7 + random() * .6);
        l.freq = 7 + random() * 9;
    }

    function arcBundle(precise) {
        // Concentric arcs of a shell, sharing an axis: the large, mostly defocused sweeps.
        var n = 2 + Math.floor(random() * 6), radius = .5 + random() * .6, start = random() * 6.28, span = .8 + random() * 1.4;
        var life = 2.5 + random() * 4, wobble = random() * .14, weight = .28 + random() * .3;
        unit(d0);
        frame(d0, e0, f0);

        for (var k = 0; k < n; k++) {
            var l = claim(SLOTS.arc);
            begin(l, ARC, life * (.85 + random() * .3), precise);
            l.c[0] = gauss() * .03;
            l.c[1] = gauss() * .03;
            l.c[2] = gauss() * .03;
            copy(d0, l.A);
            copy(e0, l.B);
            copy(f0, l.C);
            l.A[0] += gauss() * .04;
            l.A[1] += gauss() * .04;
            l.A[2] += gauss() * .04;
            normalize(l.A);
            frame(l.A, l.B, l.C);
            l.scale = radius + k * .025 + gauss() * .01;
            l.p[0] = start + gauss() * .1;
            l.p[1] = span * (.85 + random() * .3);
            l.length = l.scale * l.p[1];
            l.p[2] = wobble;
            l.family = random() * 6.28;
            l.weight = weight;
            l.ampScale = .025 * (.6 + random() * .8);
            l.freq = 3 + random() * 5;
        }
    }

    function cloud(l, precise) {
        // Ink dust: most clouds pile up in the core, a few hang along the rays.
        var core = random() < .85;
        begin(l, CLOUD, (core ? 2 : 1) + random() * 3, precise);

        if (core) {
            l.c[0] = gauss() * .025;
            l.c[1] = gauss() * .025;
            l.c[2] = gauss() * .025;
            l.scale = .01 + random() * .03;
            l.weight = .22 + random() * .3;
        }
        else {
            unit(l.c);
            var r = .2 + random() * .55;
            l.c[0] *= r;
            l.c[1] *= r;
            l.c[2] *= r;
            l.scale = .012 + random() * .03;
            l.weight = .1 + random() * .12;
        }

        l.ampScale = .03 + random() * .03;
        l.freq = 14 + random() * 18;
        l.family = 0;
        l.length = 1;
    }

    function sheet(precise) {
        // A combed sheet or net leaving the core like a wing.
        var l = claim(SLOTS.sheet), net = random() < .4;
        begin(l, SHEET, 1.8 + random() * 3.2, precise);
        unit(l.A);
        frame(l.A, l.B, l.C);
        l.scale = .3 + random() * .55;
        l.c[0] = l.A[0] * l.scale * .45 + gauss() * .04;
        l.c[1] = l.A[1] * l.scale * .45 + gauss() * .04;
        l.c[2] = l.A[2] * l.scale * .45 + gauss() * .04;
        l.family = (random() - .5) * 6;
        l.p[0] = (random() - .5) * .8;
        l.p[1] = net ? .3 + random() * .25 : 0;
        l.p[2] = 12 + Math.floor(random() * 17);
        l.extra = .2 + random() * .45;
        l.weight = (.1 + random() * .14) * 16 / l.p[2];
        l.length = l.scale * l.p[2] * .5;
        l.ampScale = .022 * (.6 + random() * .8);
        l.freq = 4 + random() * 7;
    }

    function count(range) {
        var n = 0;

        for (var i = range[0]; i < range[1]; i++)
            if (lines[i].alive)
                n++;

        return n;
    }

    function beat(strong, at) {
        beats++;

        if (strong) {
            // Snap: every line still on screen is redrawn clean, and chaos starts over.
            for (var i = SLOTS.loop[0]; i < INK_LINES; i++) {
                var l = lines[i];

                if (!l.alive)
                    continue;

                l.rampFrom = time;
                l.startFrac = 0;
                l.life = Math.max(l.life, time - l.birth + 1.2);
            }
        }

        if (random() < (strong ? .9 : .35))
            loop(true, at);

        if (strong && random() < .5)
            loop(true, at);

        var bundles = strong ? 2 + Math.floor(random() * 2) : random() < .85 ? 1 : 0;

        for (var b = 0; b < bundles; b++)
            rayBundle(true);

        if (random() < (strong ? .7 : .25))
            arcBundle(true);

        if (random() < (strong ? .8 : .3))
            sheet(true);
    }

    function step(dt) {
        time += dt;

        for (var i = 0; i < INK_LINES; i++) {
            var l = lines[i];

            if (l.alive && time - l.birth > l.life) {
                l.alive = false;

                if (l.type === CLOUD)
                    cloud(l, false);
            }
        }

        if (pulse > 0) {
            nextBeat -= dt;

            if (nextBeat <= 0) {
                beat(beats % 4 === 0, null);
                nextBeat = (1.5 - 1.15 * pulse) * (.8 + random() * .4);
            }
        }

        // Keep the scene populated between beats with lines that arrive already frayed.
        while (count(SLOTS.ray) < 55)
            rayBundle(false);

        while (count(SLOTS.arc) < 12)
            arcBundle(false);

        while (count(SLOTS.sheet) < 5)
            sheet(false);

        cam.yaw += dt * (.05 + pulse * .04);
        cam.pitch = -.22 + .16 * Math.sin(time * .07);
        cam.dist = 2.75 + .25 * Math.sin(time * .05);
        cam.target[0] = .1 * Math.sin(time * .11);
        cam.target[1] = .07 * Math.sin(time * .13 + 1);
        cam.target[2] = .08 * Math.cos(time * .09);
    }

    function writeTable() {
        for (var i = 0; i < INK_LINES; i++) {
            var l = lines[i], o = i * INK_TEXELS * 4;

            if (!l.alive) {
                table[o] = 0;
                table[o + 2] = 0;
                continue;
            }

            var age = time - l.birth, alpha = smooth(0, l.fadeIn, age) * (1 - smooth(l.life * .62, l.life, age));
            var frac = l.startFrac + (1 - l.startFrac) * smooth(0, l.ramp, time - l.rampFrom);
            var amp = l.type === CLOUD ? l.ampScale * (.4 + chaos) : l.ampScale * chaos * frac;
            var v = [l.type, l.family, alpha, l.weight * l.length, l.c[0], l.c[1], l.c[2], l.scale, l.A[0], l.A[1], l.A[2], l.p[0], l.B[0], l.B[1], l.B[2], l.p[1], l.C[0], l.C[1], l.C[2], l.p[2], amp, l.freq, l.nseed, l.extra];

            for (var k = 0; k < 24; k++)
                table[o + k] = v[k];
        }
    }

    function writeCamera(w, h) {
        var yaw = cam.yaw + cam.dragYaw, pitch = Math.max(-1.3, Math.min(1.3, cam.pitch + cam.dragPitch)), t = cam.target, e = cam.eye;
        e[0] = t[0] + cam.dist * Math.cos(pitch) * Math.sin(yaw);
        e[1] = t[1] + cam.dist * Math.sin(pitch);
        e[2] = t[2] + cam.dist * Math.cos(pitch) * Math.cos(yaw);
        // Column-major look-at.
        var z = normalize([e[0] - t[0], e[1] - t[1], e[2] - t[2]]), x = normalize(cross([0, 1, 0], z, [0, 0, 0])), y = cross(z, x, [0, 0, 0]);
        view[0] = x[0]; view[4] = x[1]; view[8] = x[2]; view[12] = -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]);
        view[1] = y[0]; view[5] = y[1]; view[9] = y[2]; view[13] = -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]);
        view[2] = z[0]; view[6] = z[1]; view[10] = z[2]; view[14] = -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]);
        view[3] = 0; view[7] = 0; view[11] = 0; view[15] = 1;
        var f = 1 / Math.tan(19 * Math.PI / 180), near = .05, far = 30;
        proj.fill(0);
        proj[0] = f / (w / h);
        proj[5] = f;
        proj[10] = (far + near) / (near - far);
        proj[11] = -1;
        proj[14] = 2 * far * near / (near - far);
    }

    function describe() {
        var tone = chaos < .08 ? 'precise' : chaos < .45 ? 'restless' : chaos < .8 ? 'unruly' : 'feral';

        return 'Rule ' + CURVES[curve].label.toLowerCase() + ', chaos ' + Math.round(chaos * 100) + ': ' + tone + '.';
    }

    function reseed() {
        seed = (seed * 31 + 7) | 0;

        for (var i = 0; i < INK_LINES; i++)
            lines[i].alive = false;

        time = 0;
        beats = 0;
        nextBeat = .25;

        for (i = SLOTS.cloud[0]; i < SLOTS.cloud[1]; i++) {
            cloud(lines[i], false);
            lines[i].birth -= random() * lines[i].life * .6;
        }

        for (i = 0; i < 6; i++) {
            rayBundle(false);
            arcBundle(false);
        }

        // Age the opening scene so it starts mid-performance rather than empty.
        for (var n = 0; n < 75; n++)
            step(1 / 30);
    }

    reseed();

    var api = {
        meta: { title: 'STOCHASTIC INK', brand: 'CHALDEA // INK STUDY', hint: 'Drag to turn the view. Tap to strike a beat. Arrow keys turn the view, Enter strikes a beat.' },
        layout: { lines: INK_LINES, texels: INK_TEXELS, groups: INK_GROUPS },
        table: table,
        view: view,
        proj: proj,
        // Camera position and the point it looks at, for hosts that drive their own camera.
        eye: cam.eye,
        target: cam.target,
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
                { type: 'button', key: 'beat', label: 'BEAT' },
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
                message = pulse === 0 ? 'Pulse off. Beats come only when you strike them.' : 'Pulse ' + Math.round(pulse * 100) + '.';
            }

            if (key === 'beat') {
                beat(true, null);
                message = 'Beat. Every line is drawn clean, then chaos takes it again.';
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
                pull.started = stamp;
            }

            if (kind === 'move' && pull.active) {
                cam.dragYaw -= (x - pull.x) * .007;
                cam.dragPitch += (y - pull.y) * .005;
                pull.x = x;
                pull.y = y;

                if (Math.abs(x - pull.sx) + Math.abs(y - pull.sy) > 6) {
                    pull.moved = true;
                    message = 'Turning the view.';
                }
            }

            if (kind === 'up' && pull.active) {
                pull.active = false;

                if (!pull.moved && stamp - pull.started < 450) {
                    beat(true, null);
                    message = 'Beat. Every line is drawn clean, then chaos takes it again.';
                }
            }

            if (kind === 'leave' || kind === 'cancel')
                pull.active = false;
        },
        key: function (name) {
            if (name === 'ArrowLeft')
                cam.dragYaw += .12;

            if (name === 'ArrowRight')
                cam.dragYaw -= .12;

            if (name === 'ArrowUp')
                cam.dragPitch = Math.max(-1, cam.dragPitch - .08);

            if (name === 'ArrowDown')
                cam.dragPitch = Math.min(1, cam.dragPitch + .08);

            if (name === 'Enter' || name === ' ')
                api.action('beat');

            if (name === 'Escape')
                api.suspend();
        },
        configure: function (value) {
            for (var key in value)
                if (Object.prototype.hasOwnProperty.call(settings, key) && value[key] !== undefined && value[key] !== null)
                    settings[key] = String(value[key]);
        },
        needsMotion: function () {
            return true;
        },
        // Advance the scene. Hosts call this once per frame with seconds since the last frame.
        advance: function (elapsed) {
            var dt = paused ? 0 : Math.min(.05, Math.max(0, elapsed || 0));

            if (dt)
                step(dt);
        },
        // Fill the line table and camera for a viewport of w by h device pixels, then return the uniforms.
        frame: function (w, h) {
            // Sizes are relative to a 460 px tall scene, so the drawing looks the same at any size or pixel density.
            var s = h / 460;
            writeTable();
            writeCamera(w, h);

            return {
                time: time % 1000,
                viewport: [w, h],
                focus: cam.dist * (.72 + focus * .56),
                aperture: .08,
                drift: .02 + chaos * .05,
                minRadius: Math.max(.75, 1.05 * s),
                maxRadius: 26 * s,
                lodArea: 2.2 * s,
                inkScale: .16 * s * s,
                keep: KEEP[settings.detail] || KEEP.Fine,
                paper: inkColor(settings.paper, '#ffffff'),
                ink: inkColor(settings.ink, '#0c0c0f')
            };
        },
        status: function () {
            return message;
        },
        suspend: function () {
            pull.active = false;
        },
        inspect: function () {
            return { time: time, paused: paused, beats: beats, rule: CURVES[curve].key, chaos: chaos, focus: focus, pulse: pulse, rays: count(SLOTS.ray), arcs: count(SLOTS.arc), loops: count(SLOTS.loop), sheets: count(SLOTS.sheet), clouds: count(SLOTS.cloud) };
        }
    };

    return api;
}
