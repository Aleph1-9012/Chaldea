// SPDX-License-Identifier: 0BSD
// Radical exchange, used by both the HTML preview and native QML.
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
    const path = (points, red = 0, alpha = 1, w = 1) => {
        marks.push({ type: 'path', points, c: colour(red), w, alpha });
    };

    const blend = (a, b, t) => a.map((point, i) => [
        lerp(point[0], b[i][0], t), lerp(point[1], b[i][1], t)
    ]);

    const project = (points, cx, cy, angle = 0) => {
        const co = Math.cos(angle), si = Math.sin(angle);

        return points.map(([x, y]) => [cx + (x * co - y * si) * 1.08, cy + (x * si + y * co) * 1.08]);
    };

    const strength = (x, y, seed, offset = 0) => {
        const rank = hash(x, y, seed) * 67;

        return smooth(clamp((p + offset + 3 - rank) / 4));
    };

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cx = 26 + col * 40, cy = 26 + row * 40;
            const orient = hash(col, row, 613) > 0.5 ? Math.PI / 2 : 0;
            const travel = (p + hash(col, row, 607) * 1.5) / 3;
            const stage = Math.floor(travel);
            const fraction = smooth(travel - stage);
            const frame = step => {
                const close = hash(col + step * 3, row, 617);
                const shuttle = lerp(-4, 4, hash(col, row + step * 11, 619));
                const upper = lerp(-3, 3, hash(col + step * 17, row, 631));
                const gap = lerp(2, 6, close);

                return [
                    [[-14, -12], [-8, -12], [-8, -3 + upper], [-gap, -3 + upper]],
                    [[14, 12], [8, 12], [8, 3 - upper], [gap, 3 - upper]],
                    [[-14, 7], [-11, 7], [-11, 13], [-3, 13]],
                    [[14, -7], [11, -7], [11, -13], [3, -13]],
                    [[-5, -13], [-5, -8], [3 + shuttle, -8]],
                    [[5, 13], [5, 8], [-3 + shuttle, 8]],
                    [[-14, -6], [-12, -6], [-12, 2 + shuttle]],
                    [[14, 6], [12, 6], [12, -2 + shuttle]],
                    [[-gap, -6], [-gap, 6], [gap, 6]],
                    [[gap, 3], [gap, -3], [gap + 3, -6]],
                    [[-5, 3 + shuttle], [-9, 3 + shuttle]],
                    [[5, -3 + shuttle], [9, -3 + shuttle]]
                ];
            };

            const a = frame(stage), b = frame(stage + 1);

            for (let j = 0; j < a.length; j++) {
                const red = strength(col, row, 641 + Math.floor(j / 2) * 31, j === 8 || j === 9 ? 10 : 0);
                const points = project(blend(a[j], b[j], fraction), cx, cy, orient);
                const central = j === 8 || j === 9;
                path(points, red, central ? 1 : 0.78, central ? 1.45 : j < 2 ? 1.2 : 1);
            }

            if (row < 5 && hash(col, row, 857) > 0.57) {
                const shift = lerp(-7, 7, hash(col, row, 859));
                path([[cx + shift, cy + 16], [cx + shift, cy + 20], [cx + shift + 3, cy + 24]], strength(col, row, 863, 4), 0.5, 0.85);
            }
        }
    }

    return marks;
}
