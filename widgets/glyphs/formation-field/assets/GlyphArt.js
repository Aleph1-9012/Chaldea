// SPDX-License-Identifier: 0BSD
// Original Formation field drawing rules, extracted from the reactive studies.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const lerp = (a, b, t) => a + (b - a) * t;

const smooth = v => {
    const t = clamp(v);

    return t * t * (3 - 2 * t);
};

const ink = { dark: '#282724', grey: '#68665e' };

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
    const transform = (points, cx, cy, angle) => points.map(([x, y]) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);

    for (let y = 0; y < 14; y++)
        for (let x = 0; x < 14; x++) {
            const cx = 9 + x * 18, cy = 9 + y * 18;
            const field = Math.sin(x * .29 + p * .17) * 1.05 + Math.cos(y * .28 - p * .12) * .9;
            const a = field + Math.sin((x + y) * .21) * .4;
            const wave = Math.sin(x * .29 - y * .33 + p * .19);
            const t = smooth((wave - .55 + p * .014) * 4);
            const l = 5.8 + 1.8 * t;
            const c = colour(t);
            path(transform([[-l, -1.8], [l, -1.8]], cx, cy, a), c, 1.15);
            path(transform([[-l + 2, 1.8], [l - 2, 1.8]], cx, cy, a), c, 1.15);

            if ((x + y) % 3 === 0) rect(cx - .65, cy - .65, 1.3, 1.3, ink.dark);
        }

    return marks;
}
