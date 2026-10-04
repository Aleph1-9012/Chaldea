// SPDX-License-Identifier: 0BSD
// Original Punch record drawing rules, extracted for the glyph preview.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const lerp = (a, b, t) => a + (b - a) * t;

const smooth = v => {
    const t = clamp(v);

    return t * t * (3 - 2 * t);
};

function hash(x, y, seed = 0) {
    let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed + 1, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);

    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const glyphRanks = (() => {
    const ordered = Array.from({ length: 18 * 9 }, (_, i) => i).sort((a, b) => hash(a % 18, Math.floor(a / 18), 31) - hash(b % 18, Math.floor(b / 18), 31));
    const ranks = [];
    ordered.forEach((cell, i) => ranks[cell] = i);

    return ranks;
})();

function glyphColour(t, emphasis) {
    t = clamp(t * emphasis / 100);
    const a = [104, 102, 94], b = [209, 22, 28];

    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
}

function glyphMarks(p, emphasis) {
    const colour = t => glyphColour(t, emphasis);
    const ink = { grey: '#68665e', light: '#b7b3a8', red: '#d1161c' };
    const marks = [];
    const path = (points, c = ink.grey, w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const rect = (x, y, w, h, c = ink.grey, alpha = 1) => marks.push({ type: 'rect', x, y, w, h, c, alpha });
    const text = (value, x, y, size, c, clip) => marks.push({ type: 'text', value, x, y, size, c, clip, family: 'JetBrains Mono', alpha: 1 });

    path([[7, 22], [7, 7], [245, 7], [245, 245], [7, 245], [7, 38]], ink.grey, .85);
    text('704', 49, 41, 29, ink.light, [8, 8, 236, 236]);
    text('17', 225, 35, 16, ink.red, [8, 8, 236, 236]);

    for (let n = 0; n < 17; n++) {
        const w = hash(n, 0, 41) > .5 ? 2.8 : 1;
        rect(96 + n * 5, 18, w, 21, n % 4 === 0 ? ink.red : ink.grey);
    }

    for (let y = 0; y < 9; y++) {
        text(String(y + 1).padStart(2, '0'), 18, 70 + y * 20, 11, ink.grey, [8, 46, 236, 190]);

        for (let x = 0; x < 18; x++) {
            const rank = glyphRanks[y * 18 + x], px = 35 + x * 11.4, py = 58 + y * 20;
            const punched = smooth((p * 2 + 12 - rank) / 1.8);
            rect(px, py, 3.4, 12, '#2a2925');
            rect(px, py + 12 * (1 - punched), 3.4, 12 * punched, colour(1));
        }
    }

    const n = clamp(p * 2 + 12, 0, 160), a = Math.floor(n), b = a + 1, f = n - a;
    const ia = glyphRanks.indexOf(a), ib = glyphRanks.indexOf(b);
    const ax = 35 + (ia % 18) * 11.4, ay = 58 + Math.floor(ia / 18) * 20;
    const bx = 35 + (ib % 18) * 11.4, by = 58 + Math.floor(ib / 18) * 20;
    const x = lerp(ax, bx, smooth(f * 2)), y = lerp(ay, by, smooth(f * 2 - 1));
    path([[x - 3, y + 4], [x - 3, y - 3], [x + 3, y - 3]], ink.light, .9);
    path([[x + .4, y + 15], [x + 6.4, y + 15], [x + 6.4, y + 8]], ink.light, .9);

    return marks;
}
