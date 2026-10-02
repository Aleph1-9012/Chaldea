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
    const forms = [
        [[-5, -6], [-5, 5], [4, 5]], [[4, -6], [4, 1], [-5, 1], [-5, 6]],
        [[-5, 5], [5, -5], [5, 2]], [[-5, -4], [5, -4], [5, 5], [-2, 5]],
        [[-5, -6], [0, -6], [0, 6], [5, 6]], [[-5, 0], [5, 0], [5, -5]],
        [[-4, -6], [-4, 5], [5, -4]], [[-5, -5], [0, 0], [-5, 5], [5, 5]]
    ];

    function clippedLine(a, b, c, w) {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        let lo = 0, hi = 1;

        for (const [v, q] of [[-dx, a[0] - 4], [dx, 248 - a[0]], [-dy, a[1] - 4], [dy, 248 - a[1]]]) {
            if (Math.abs(v) < 1e-9) {
                if (q < 0)
                    return;

                continue;
            }

            const r = q / v;

            if (v < 0)
                lo = Math.max(lo, r);
            else
                hi = Math.min(hi, r);
        }

        if (lo <= hi)
            path([[a[0] + lo * dx, a[1] + lo * dy], [a[0] + hi * dx, a[1] + hi * dy]], c, w);
    }

    for (let col = 0; col < 14; col++) {
        const speed = (col % 2 ? 1 : -1) * (4.5 + (col % 3) * 2.25), offset = p * speed;
        const begin = Math.floor(-offset / 18) - 1;

        for (let row = begin; row < begin + 17; row++) {
            const cx = 9 + col * 18, cy = 9 + row * 18 + offset;
            const index = Math.floor(hash(col, row, 7) * forms.length);
            const angle = Math.floor(hash(col, row, 8) * 4) * Math.PI / 2;
            const tint = smooth((p * .01 + .2 - hash(col, row, 16)) / .2), c = colour(tint);
            const points = transform(forms[index], cx, cy, angle);

            for (let i = 0; i < points.length - 1; i++)
                clippedLine(points[i], points[i + 1], c, 1.05);

            const small = transform([[-5, -6], [-2, -6]], cx, cy, angle + Math.PI / 2);
            clippedLine(small[0], small[1], c, .75);
        }
    }

    return marks;
}
