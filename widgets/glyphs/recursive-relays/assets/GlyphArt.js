// SPDX-License-Identifier: 0BSD
// Original drawing rules, used by both the HTML preview and native QML.
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

function glyphColour(t, emphasis) {
    t = clamp(t * emphasis / 100);
    const a = [104, 102, 94], b = [209, 22, 28];

    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
}

function glyphMarks(p, emphasis) {
    const colour = t => glyphColour(t, emphasis);
    const marks = [];
    const path = (points, c = colour(0), w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const transform = (points, cx, cy, angle) => points.map(([x, y]) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);
    function relay(cx, cy, s, a, c, w, alpha = 1) {
        const h = s / 2, b = s * .31;
        path(transform([[-h, 0], [-b, 0], [-b, -b], [0, -b], [0, -h]], cx, cy, a), c, w, alpha);
        path(transform([[0, h], [0, b], [b, b], [b, 0], [h, 0]], cx, cy, a), c, w, alpha);
    }

    for (let y = 0; y < 6; y++)
        for (let x = 0; x < 6; x++) {
            const key = y * 6 + x, cx = 26 + x * 40, cy = 26 + y * 40, bank = (key * 3) % 8;
            const turn = Math.floor(p / 8) + smooth(clamp(p % 8 - bank));
            const angle = (Math.floor(hash(x, y, 4) * 4) + turn) * Math.PI / 2;
            const tint = smooth((p * .012 + .25 - hash(x, y, 23)) / .2);
            relay(cx, cy, 40, angle, colour(tint), 1.1);

            for (let side = 0; side < 4; side++)
                path(transform([[0, -12.4], [0, -8.3]], cx, cy, side * Math.PI / 2), colour(tint), .7, .75);

            const inner = (Math.floor(hash(x, y, 9) * 4) - turn) * Math.PI / 2;

            if (hash(x, y, 11) > .38) {
                relay(cx, cy, 16.6, inner, colour(tint * .7 + .18), .85);
                relay(cx, cy, 7, -inner, colour(tint), .65, .82);
            }
            else {
                for (let q = 0; q < 4; q++)
                    relay(cx + (q % 2 ? 4.15 : -4.15), cy + (q < 2 ? -4.15 : 4.15), 8.3, inner + q * Math.PI / 2, colour(tint), .7, .86);
            }
        }

    return marks;
}
