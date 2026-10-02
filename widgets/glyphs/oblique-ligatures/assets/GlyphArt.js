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
    const path = (points, red = 0, alpha = 1, w = 1) => {
        marks.push({ type: 'path', points, c: colour(red), w, alpha });
    };

    const blend = (a, b, t) => a.map((point, i) => [
        lerp(point[0], b[i][0], t), lerp(point[1], b[i][1], t)
    ]);

    const project = (points, cx, cy, angle = 0) => {
        const co = Math.cos(angle), si = Math.sin(angle);

        return points.map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]);
    };

    const strength = (x, y, seed, offset = 0) => {
        const rank = hash(x, y, seed) * 67;

        return smooth(clamp((p + offset + 3 - rank) / 4));
    };

    const stage = Math.floor(p / 2);
    const fraction = smooth(p / 2 - stage);

    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const cx = 18 + col * 24, cy = 18 + row * 24;
            const orient = Math.floor(hash(col, row, 417) * 4) * Math.PI / 2;
            const frame = step => {
                const side = hash(col + step * 13, row, 409) > 0.5 ? 1 : -1;
                const bend = lerp(-2.5, 2.5, hash(col, row + step * 7, 433));
                const upper = lerp(4, 8, hash(col + step, row, 449));
                const lower = lerp(4, 8, hash(col, row + step, 463));

                return [
                    [[-7, 10], [-4, 3], [2 + bend, -2], [6, -10]],
                    [[-4, 3], [-9, 3 - side * lower * 0.6], [-10, -side * lower]],
                    [[2 + bend, -2], [9, -2 - side * upper * 0.55], [10, -side * upper]],
                    [[-6, 8], [-1, 8], [2, 4 + bend]],
                    [[2, -7], [-3, -7], [-5, -3 + bend]],
                    [[-10, 8], [-8, 4]],
                    [[8, -7], [10, -11]]
                ];
            };

            const a = frame(stage), b = frame(stage + 1);

            for (let j = 0; j < a.length; j++) {
                const red = strength(col, row, 479 + j * 29, j === 0 ? 8 : 0);
                const points = project(blend(a[j], b[j], fraction), cx, cy, orient);
                path(points, red, j > 4 ? 0.45 : j === 0 ? 0.95 : 0.69);
            }

            // Sparse joints link neighbouring figures without creating long rules.
            if (col < 9 && hash(col, row, 541) > 0.67) {
                const y = cy + lerp(-6, 6, hash(col, row, 547));
                path([[cx + 10, y], [cx + 12, y - 2], [cx + 14, y - 2]], strength(col, row, 557, 5), 0.48);
            }
        }
    }

    return marks;
}
