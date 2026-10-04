// SPDX-License-Identifier: 0BSD
// Original Stencil assembly drawing rules, extracted for the glyph preview.
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
    const ordered = Array.from({ length: 12 }, (_, i) => i).sort((a, b) => hash(0, a, 16) - hash(0, b, 16));
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
    const ink = { dark: '#282724', grey: '#68665e', red: '#d1161c' };
    const marks = [];
    const path = (points, c = ink.grey, w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const text = (value, x, y, size, c, clip) => marks.push({ type: 'text', value, x, y, size, c, clip, family: 'Noto Sans JP', alpha: 1 });

    for (let band = 0; band < 12; band++) {
        const sy = 6 + band * 20;
        const order = glyphRanks[band], settle = smooth((p - order * .85) / 2);
        const direction = band % 2 ? 1 : -1;
        const dx = direction * (8 + hash(band, 0, 1) * 12) * (1 - settle) + Math.sin(p * .7 + band * .9) * (1 + settle);
        const tint = smooth((p * 1.2 + 1 - order) / 2);
        text('継', 126 + dx, 117, 112, colour(tint), [8, sy, 236, 18.5]);
        text('衛', 126 + dx, 237, 112, colour(tint), [8, sy, 236, 18.5]);
        path([[10, sy + 8], [15 + 5 * settle, sy + 8]], tint > .5 ? ink.red : ink.grey, .8);
        path([[237 - 5 * settle, sy + 8], [242, sy + 8]], tint > .5 ? ink.red : ink.grey, .8);
    }

    path([[5, 6], [5, 246]], ink.dark, .8);
    path([[247, 6], [247, 246]], ink.dark, .8);

    return marks;
}
