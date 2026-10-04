// SPDX-License-Identifier: 0BSD
// Original Shutter bank drawing rules, extracted from the reactive studies.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const lerp = (a, b, t) => a + (b - a) * t;

const smooth = v => {
    const t = clamp(v);

    return t * t * (3 - 2 * t);
};

// A two-dimensional integer hash avoids the old modulo formula's repeated rows.
function hash(x, y, seed = 0) {
    let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed + 1, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);

    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const ink = { black: '#090909', dark: '#282724', grey: '#68665e', light: '#b7b3a8' };
const ordered = Array.from({ length: 54 }, (_, i) => i).sort((a, b) => hash(a % 6, Math.floor(a / 6), 11) - hash(b % 6, Math.floor(b / 6), 11));
const ranks = [];
ordered.forEach((cell, i) => ranks[cell] = i);

function glyphColour(t, emphasis) {
    t = clamp(t * emphasis / 100);
    const a = [104, 102, 94], b = [209, 22, 28];

    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
}

function glyphMarks(p, emphasis) {
    const colour = t => glyphColour(t, emphasis);
    const marks = [];
    const path = (points, c = ink.grey, w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const rect = (x, y, w, h, c = ink.grey, alpha = 1) => marks.push({ type: 'rect', x, y, w, h, c, alpha });

    for (let y = 0; y < 9; y++)
        for (let x = 0; x < 6; x++) {
            const i = y * 6 + x, rank = ranks[i], px = 10 + x * 39, py = 9 + y * 26;
            const open = smooth((p * .75 + 9 - rank) / 2);
            const vertical = hash(x, y, 2) > .52;
            const w = 34, h = 21;
            rect(px, py, w, h, ink.dark);
            rect(px + 1, py + 1, w - 2, h - 2, colour(.75 + .25 * open));

            // The cover retracts along either its horizontal or vertical rail.
            if (vertical) rect(px, py, w, h * (1 - open), '#171715');
            else rect(px, py, w * (1 - open), h, '#171715');

            if (vertical) path([[px, py + h * (1 - open)], [px + w, py + h * (1 - open)]], open > .1 ? ink.light : ink.grey, 1);
            else path([[px + w * (1 - open), py], [px + w * (1 - open), py + h]], open > .1 ? ink.light : ink.grey, 1);

            path([[px + 3, py + 4], [px + 7, py + 4]], open > .5 ? ink.black : ink.grey, 1);
            rect(px + w - 4, py + h - 4, 2, 2, open > .5 ? ink.black : ink.grey);
        }

    return marks;
}
