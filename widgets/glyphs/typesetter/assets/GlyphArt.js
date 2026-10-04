// SPDX-License-Identifier: 0BSD
// Original Typesetter drawing rules, extracted for the glyph preview.
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
    const ordered = Array.from({ length: 14 * 14 }, (_, i) => i).sort((a, b) => hash(a % 14, Math.floor(a / 14), 7) - hash(b % 14, Math.floor(b / 14), 7));
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
    const marks = [];
    const path = (points, c = '#68665e', w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const motifs = [
        [[-5, -6], [-5, 5], [-5, 5], [4, 5], [1, -6], [5, -6]],
        [[-5, -5], [5, 5], [-5, 5], [-1, 1], [2, -5], [5, -5]],
        [[-5, 0], [5, 0], [0, -6], [0, 6], [4, 4], [5, 4]],
        [[-4, -6], [-4, 1], [-4, 1], [5, 1], [5, 1], [5, 6]],
        [[-5, 5], [5, -5], [-5, -5], [-5, -2], [2, 5], [5, 5]],
        [[-5, -5], [5, -5], [5, -5], [5, 5], [-5, 5], [0, 5]],
        [[-4, -6], [-4, 6], [0, -2], [5, -2], [5, -2], [5, 4]],
        [[-5, -5], [-1, -5], [-1, -5], [-1, 5], [2, 0], [6, 0]]
    ];

    for (let y = 0; y < 14; y++)
        for (let x = 0; x < 14; x++) {
            const rank = glyphRanks[y * 14 + x], cx = 9 + x * 18, cy = 9 + y * 18;
            const local = p * .55 + hash(x, y, 3) * 3;
            const step = Math.floor(local), f = smooth(local - step);
            const from = Math.floor(hash(x, y, 19 + step) * motifs.length);
            const to = Math.floor(hash(x, y, 20 + step) * motifs.length);
            const tint = smooth((p * 7 + 13 - rank) / 5);

            for (let k = 0; k < 6; k += 2)
                path([0, 1].map(n => [cx + lerp(motifs[from][k + n][0], motifs[to][k + n][0], f), cy + lerp(motifs[from][k + n][1], motifs[to][k + n][1], f)]), colour(tint), 1.1);
        }

    return marks;
}
