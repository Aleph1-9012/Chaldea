// SPDX-License-Identifier: 0BSD
// Branch grammar, used by both the HTML preview and native QML.
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
    const a = [142, 137, 126], b = [209, 22, 28];

    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
}

function glyphMarks(p, emphasis) {
    const colour = t => glyphColour(t, emphasis);
    const marks = [];
    const path = (points, c = colour(0), w = 1, alpha = 1) => marks.push({ type: 'path', points, c, w, alpha });
    const transform = (points, cx, cy, angle) => points.map(([x, y]) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);
    function branch(cx, cy, size, depth, key) {
        const alpha = depth < 3 ? 1 : smooth((p + 6 - hash(key, depth, 31) * 20) / 5);
        const hx = size * .24 * (1 + .07 * Math.sin(p * .37 + key * .4));
        const hy = size * .24 * (1 + .07 * Math.cos(p * .33 + key * .6));
        const angle = depth === 0 ? 0 : Math.floor(hash(key, depth, 8) * 2) * Math.PI / 2;
        const tint = smooth((p * .011 + .19 - hash(key, depth, 18)) / .2);

        if (alpha > .004) {
            const c = colour(tint), w = depth === 0 ? 1.5 : depth === 1 ? 1.15 : depth === 2 ? .9 : .75;
            path(transform([[-hx, 0], [hx, 0]], cx, cy, angle), c, w, alpha);
            path(transform([[-hx, -hy], [-hx, hy]], cx, cy, angle), c, w, alpha);
            path(transform([[hx, -hy], [hx, hy]], cx, cy, angle), c, w, alpha);

            if (depth >= 3)
                path(transform([[-hx, hy * .35], [0, hy * .35], [0, hy * .8]], cx, cy, angle), c, .75, alpha * .75);
        }

        if (depth < 3)
            for (let child = 0; child < 4; child++) {
                const points = transform([[(child % 2 ? 1 : -1) * hx, (child < 2 ? -1 : 1) * hy]], cx, cy, angle);
                const childKey = key * 4 + child + 1;
                const ratio = .4 + .1 * smooth((1 + Math.sin(p * .19 + hash(childKey, depth, 9) * 6.28)) / 2);
                branch(points[0][0], points[0][1], size * ratio, depth + 1, childKey);
            }
    }

    for (let y = 0; y < 3; y++)
        for (let x = 0; x < 3; x++)
            branch(46 + x * 80, 46 + y * 80, 80, 0, y * 3 + x + 1);

    return marks;
}
