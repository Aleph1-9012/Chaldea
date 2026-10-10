// SPDX-License-Identifier: 0BSD
// Original Phase field, formation terminals, and K glyph drawing rules.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const lerp = (a, b, t) => a + (b - a) * t;

const smooth = v => {
    const x = clamp(v);

    return x * x * (3 - 2 * x);
};

const ramp = (p, a, b) => smooth((p - a) / (b - a));

function hash(x, y, seed = 0) {
    let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed + 1, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);

    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function strokePath(c, points, color, lineWidth = 1, alpha = 1, fraction = 1) {
    if (points.length < 2 || alpha <= .001 || fraction <= .001)
        return;
    c.beginPath();
    c.moveTo(...points[0]);

    if (fraction >= .9999) {
        for (let i = 1; i < points.length; i++)
            c.lineTo(...points[i]);
    }
    else {
        let total = 0;
        const lengths = [];

        for (let i = 1; i < points.length; i++) {
            const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
            lengths.push(d);
            total += d;
        }

        let remaining = total * clamp(fraction);

        for (let i = 1; i < points.length; i++) {
            const length = lengths[i - 1];

            if (remaining >= length) {
                c.lineTo(...points[i]);
                remaining -= length;
            }
            else {
                const q = length ? remaining / length : 0;
                c.lineTo(lerp(points[i - 1][0], points[i][0], q), lerp(points[i - 1][1], points[i][1], q));
                break;
            }
        }
    }

    c.strokeStyle = color;
    c.lineWidth = lineWidth;
    c.globalAlpha = clamp(alpha);
    c.stroke();
}

// Orthogonal glyph paths use integer device-pixel widths and aligned stroke centers.
function crispStroke(c, points, color, lineWidth = 1, alpha = 1, fraction = 1, scale = 1) {
    if (points.length < 2 || alpha <= .001 || fraction <= .001)
        return;
    const path = [points[0]], lengths = [];
    let total = 0;

    for (let i = 1; i < points.length; i++) {
        const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
        lengths.push(d);
        total += d;
    }

    let remaining = total * clamp(fraction);

    for (let i = 1; i < points.length; i++) {
        const d = lengths[i - 1];

        if (remaining >= d) {
            path.push(points[i]);
            remaining -= d;
        }
        else {
            const q = d ? remaining / d : 0;
            path.push([lerp(points[i - 1][0], points[i][0], q), lerp(points[i - 1][1], points[i][1], q)]);
            break;
        }
    }

    const m = { a: scale, b: 0, c: 0, d: scale, e: 0, f: 0 };
    const pixels = Math.max(1, Math.round(lineWidth * scale)), offset = pixels % 2 / 2;
    const snap = v => Math.round(v - offset) + offset;
    const raster = path.map(([x, y]) => [snap(x * m.a + y * m.c + m.e), snap(x * m.b + y * m.d + m.f)]);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    strokePath(c, raster, color, pixels, alpha);
    c.restore();
}

function buildSystem(kind, w, h, box) {
    const s = { kind, w, h, box: { x: box.x, y: box.y, w: box.w, h: box.h, folio: box.folio }, cells: [], ribbons: [] };

    if (kind === 'phase') {
        const size = 84, cols = Math.ceil(w / size), rows = Math.ceil(h / size), ox = (w - cols * size) / 2, oy = (h - rows * size) / 2;
        function cell(x, y, size, key, depth) { const node = { x, y, size, key, depth, angle: Math.floor(hash(key, depth, 27) * 4) * Math.PI / 2, children: [] }; if (depth < 2 && hash(key, depth, 34) > (depth === 0 ? .19 : .58))

            for (let i = 0; i < 4; i++)
                node.children.push(cell(x + (i % 2 ? 1 : -1) * size / 4, y + (i < 2 ? -1 : 1) * size / 4, size / 2, key * 5 + i + 1, depth + 1)); return node; }

        for (let y = 0; y < rows; y++)
            for (let x = 0; x < cols; x++)
                s.cells.push(cell(ox + (x + .5) * size, oy + (y + .5) * size, size, y * cols + x + 1, 0));
    }

    return s;
}

function cellGlyph(c, node, cx, cy, size, alpha, p, strength) {
    if (alpha < .006)
        return;
    const { key, depth } = node, q = ramp(p, .09 + hash(key, depth, 5) * .14, .65 + depth * .10), shift = (1 - q) * (hash(key, depth, 6) - .5) * .34;
    const points = [[[-.36, -.39], [-.36, .33], [-.12, .33]], [[-.36, -.12], [.32, -.12], [.32, .11]], [[.02 + shift, -.40], [.02 + shift, .35]], [[-.12, .12], [.35, .12], [.35, .40]], [[.22, -.40], [.40, -.40], [.40, -.24]]];
    const cos = Math.cos(node.angle), sin = Math.sin(node.angle), red = hash(key, depth, 81) > .968;
    const tint = red ? '#b71d22' : '#7c796e';

    for (let i = 0; i < points.length; i++) {
        const local = ramp(p, .02 + hash(key, i, 13) * .20, .40 + hash(key, i, 13) * .26), part = points[i].map(([x, y]) => [cx + (x * cos - y * sin) * size, cy + (x * sin + y * cos) * size]);
        crispStroke(c, part, tint, 1, alpha * strength * (red ? .82 : .47), local);
    }
}

function drawPhase(c, s, p, strength) {
    const alive = ramp(p, 0, .14);
    function branch(node, alpha = 1, x = node.x, y = node.y, size = node.size) {
        const split = node.children.length ? ramp(p, .14 + node.depth * .15 + hash(node.key, 1, 2) * .08, .55 + node.depth * .15) : 0;
        cellGlyph(c, node, x, y, size, alpha * (1 - split) * alive, p, strength);

        if (split > 0)
            for (const child of node.children)
                branch(child, alpha * split, lerp(x, child.x, split), lerp(y, child.y, split), lerp(size * .72, child.size, split));
    }

    s.cells.forEach(node => branch(node));
}

function drawSystem(c, s, p, strength = 1) {
    p = clamp(p);
    strength = clamp(strength);
    c.globalAlpha = 1;
    c.fillStyle = '#080808';
    c.fillRect(0, 0, s.w, s.h);
    c.lineCap = 'butt';
    c.lineJoin = 'miter';

    if (p === 0) return;

    drawPhase(c, s, p, strength);
    c.globalAlpha = 1;
}

function componentState(kind, p) {
    const late = kind === 'tissue' ? .04 : kind === 'interference' ? .07 : 0;

    return { back: ramp(p, .10, .35), border: ramp(p, .18, .73), folio: ramp(p, .28 + late, .67 + late), folioText: ramp(p, .49 + late, .76 + late), user: ramp(p, .41 + late, .68 + late), clock: ramp(p, .48 + late, .74 + late), glyph: ramp(p, .22 + late, .73 + late), auth: ramp(p, .59 + late, .87 + late) };
}

function drawRegister(c, s, p) {
    c.clearRect(0, 0, s.w, s.h);

    if (p <= 0 || p >= 1)
        return;
    const { x, y, w, h, folio } = s.box, q = componentState(s.kind, p), active = ramp(p, .06, .17) * (1 - ramp(p, .78, .97)), red = '#b91a20', grey = '#999486';
    const corners = [[[x, y + 32], [x, y], [x + 32, y]], [[x + w - 32, y], [x + w, y], [x + w, y + 32]], [[x + w, y + h - 32], [x + w, y + h], [x + w - 32, y + h]], [[x + 32, y + h], [x, y + h], [x, y + h - 32]]];
    corners.forEach((pts, i) => strokePath(c, pts, i === 0 || i === 2 ? red : grey, 1, active * .9, ramp(p, .05 + i * .025, .29 + i * .035)));

    if (s.kind === 'phase') {
        for (let i = 0; i < 19; i++) {
            const xx = x + (i + .5) * w / 19, l = lerp(7, 1, q.border);
            strokePath(c, [[xx, y - l], [xx, y + l]], i % 6 === 0 ? red : grey, .75, active * .7);
            strokePath(c, [[xx, y + h - l], [xx, y + h + l]], grey, .75, active * .45);
        }

        strokePath(c, [[x + folio, y], [x + folio, y + h]], red, .8, active * .6, ramp(p, .18, .61));
    }

    c.globalAlpha = 1;
}

function drawCorners(c, s, p, lockLabel = 'LOCKED') {
    c.clearRect(0, 0, s.w, s.h);
    const opacity = ramp(p, .28, .74);

    if (opacity <= .001)
        return;
    const compact = s.w < 540, inset = compact ? 14 : 20, W = Math.min(244, (s.w - inset * 2 - 20) / 2);
    const L = inset, R = s.w - inset - W, T = 14, B = s.h - 58;
    const white = '#e4e2dc', grey = '#aaa59b', dim = '#57534b', red = '#d1161c', black = '#080808';
    const reveal = ramp(p, .28, .74);
    c.save();
    c.lineCap = 'butt';
    c.lineJoin = 'miter';
    function block(x, y, w, h, color = black, a = 1) {
        c.globalAlpha = opacity * a;
        c.fillStyle = color;
        c.fillRect(x, y, w, h);
    }

    function line(points, color = dim, alpha = 1) {
        crispStroke(c, points, color, 1, opacity * alpha, reveal);
    }

    function type(value, x, y, color = grey, size = 11, weight = 400, spacing = 0, align = 'left') {
        c.font = weight + ' ' + size + 'px "JetBrains Mono", "Noto Sans JP", monospace';
        c.textBaseline = 'middle';
        c.textAlign = 'left';
        c.fillStyle = color;
        c.globalAlpha = opacity;
        const chars = Array.from(value), width = chars.reduce((n, char) => n + c.measureText(char).width, 0) + Math.max(0, chars.length - 1) * spacing;

        if (align === 'right')
            x -= width;
        else if (align === 'center')
            x -= width / 2;
        x = Math.round(x);
        y = Math.round(y);

        for (const char of chars) {
            c.fillText(char, x, y);
            x += c.measureText(char).width + spacing;
        }
    }

    function diamond(x, y, filled = false, color = red, size = 3) {
        if (filled) {
            c.globalAlpha = opacity;
            c.fillStyle = color;
            c.beginPath();
            c.moveTo(x, y - size);
            c.lineTo(x + size, y);
            c.lineTo(x, y + size);
            c.lineTo(x - size, y);
            c.closePath();
            c.fill();
        }
        else
            line([[x, y - size], [x + size, y], [x, y + size], [x - size, y], [x, y - size]], color);
    }

    function backing(x, y, w = W) { block(x - 5, y - 3, w + 10, 50); }
    const shortLock = compact ? (lockLabel === 'LOCKED' ? 'LOCKED' : lockLabel.startsWith('UNLOCK') ? 'RELEASE' : 'REGISTER') : lockLabel;
    {
        backing(L, T);
        backing(R, T);
        backing(L, B);
        backing(R, B);
        line([[L, T + 35], [L, T + 5], [L + 26, T + 5], [L + 26, T + 28], [L + 10, T + 28], [L + 10, T + 16], [L + 35, T + 16]], grey);
        line([[L + 6, T], [L + 6, T + 39], [L + 21, T + 39]], red);
        diamond(L + 26, T + 5, true, red, 2.5);
        type('TSUGUMORI', L + 44, T + 13, white, 11, 500, compact ? 0 : .7);
        type('TYPE-17', L + 44, T + 33, grey, 11);
        line([[R + W - 43, T + 6], [R + W, T + 6], [R + W, T + 38], [R + W - 43, T + 38]], red);
        type('704', R + W - 22, T + 23, red, 20, 500, 0, 'center');
        type('SID0NIA', R, T + 13, white, 11, 500, .3);
        line([[R, T + 32], [R + W - 56, T + 32], [R + W - 56, T + 22], [R + W - 48, T + 22]]);
        diamond(R, T + 32, false, grey, 2.5);
        const step = (W - 18) / 3;

        for (let i = 0; i < 4; i++) {
            const x = L + 9 + i * step, y = B + 10 + (i % 2 ? 8 : 0);

            if (i < 3)
                line([[x, y], [x + step * .5, y], [x + step * .5, B + 10 + ((i + 1) % 2 ? 8 : 0)], [x + step, B + 10 + ((i + 1) % 2 ? 8 : 0)]], dim);
            diamond(x, y, i === 3, i === 3 ? red : grey, 3);
            type('0' + (i + 1), x, B + 38, i === 3 ? red : grey, 11, 400, 0, 'center');
        }

        type(shortLock, R + W - 15, B + 12, white, 11, 500, .6, 'right');
        line([[R, B + 9], [R, B + 33], [R + W - 14, B + 33], [R + W - 14, B + 43]], grey);
        line([[R + W - 4, B + 4], [R + W - 4, B + 25], [R + W - 29, B + 25]], red);
        diamond(R + W - 14, B + 43, true, red, 3);

        if (!compact)
            type('LOCAL // 17', R + 8, B + 19, grey, 11);
    }

    c.restore();
    c.globalAlpha = 1;
}

const state = { red: 100 };

const ink = { black: '#090909', dark: '#282724', grey: '#68665e', light: '#b7b3a8', red: '#d1161c', bright: '#ed272d' };

function colour(t) {
    t = clamp(t * state.red / 100);
    const a = [104, 102, 94], b = [209, 22, 28];

    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
}

function makeArt(kind, p) {
    const marks = [];
    const path = (points, c = ink.grey, w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const transform = (points, cx, cy, angle) => points.map(([x, y]) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);

    if (kind === 'k') {
        function glyph(cx, cy, size, key, depth, alpha) {
            if (alpha < .004)
                return;
            const a = Math.floor(hash(key, depth, 27) * 4) * Math.PI / 2;
            const bend = (hash(key, depth, 17) - .5) * .26;
            const local = Math.sin(p * .24 + key) * .075;
            const strokes = [
                [[-.35, -.4], [-.35, .34], [-.14, .34]],
                [[-.35, -.13], [.31, -.13], [.31, .12]],
                [[.02 + bend, -.39], [.02 + bend, .34]],
                [[-.12, .12 + local], [.35, .12 + local], [.35, .39]],
                [[-.4, -.39], [-.2, -.39]],
                [[.22, -.4], [.4, -.4], [.4, -.25]]
            ];
            const tint = smooth((p * .075 + .23 - hash(key, depth, 61)) / .2);
            strokes.forEach(points => path(transform(points.map(([x, y]) => [x * size, y * size]), cx, cy, a), colour(tint), Math.max(.75, size * .031), alpha));
        }

        function branch(cx, cy, size, key, depth, threshold, alpha) {
            const split = depth < 3 ? smooth((p - threshold) / 2.2) : 0;
            glyph(cx, cy, size, key, depth, alpha * (1 - split));

            if (split > 0)
                for (let child = 0; child < 4; child++) {
                    const childKey = key * 5 + child + 1;
                    const x = cx + (child % 2 ? 1 : -1) * size * .25 * split;
                    const y = cy + (child < 2 ? -1 : 1) * size * .25 * split;
                    const next = depth === 0 ? -2 + hash(childKey, depth, 7) * 25 : threshold + 6 + hash(childKey, depth, 7) * 16;
                    branch(x, y, size * .5, childKey, depth + 1, next, alpha * split);
                }
        }

        for (let y = 0; y < 3; y++)
            for (let x = 0; x < 3; x++)
                branch(48 + x * 78, 48 + y * 78, 78, y * 3 + x + 1, 0, -4, 1);
    }

    return marks;
}
