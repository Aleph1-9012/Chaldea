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

    const stage = Math.floor(p / 2.5);
    const fraction = smooth(p / 2.5 - stage);

    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
            const cx = 18 + col * 36, cy = 18 + row * 36;
            const orient = hash(col, row, 613) > 0.5 ? Math.PI / 2 : 0;
            const frame = step => {
                const close = hash(col + step * 3, row, 617);
                const shuttle = lerp(-4, 4, hash(col, row + step * 11, 619));
                const upper = lerp(-3, 3, hash(col + step * 17, row, 631));
                const gap = lerp(1.5, 5.5, close);

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
                    [[5, -3 + shuttle], [9, -3 + shuttle]],
                    [[-1 + shuttle, -14], [3 + shuttle, -14]],
                    [[1 - shuttle, 14], [-3 - shuttle, 14]]
                ];
            };

            const a = frame(stage), b = frame(stage + 1);

            for (let j = 0; j < a.length; j++) {
                const red = strength(col, row, 641 + Math.floor(j / 2) * 31, j === 8 || j === 9 ? 10 : 0);
                const points = project(blend(a[j], b[j], fraction), cx, cy, orient);
                path(points, red, j >= 12 ? 0.5 : j === 8 || j === 9 ? 0.96 : 0.71);
            }

            if (row < 6 && hash(col, row, 857) > 0.57) {
                const shift = lerp(-7, 7, hash(col, row, 859));
                path([[cx + shift, cy + 15], [cx + shift, cy + 18], [cx + shift + 3, cy + 21]], strength(col, row, 863, 4), 0.47);
            }
        }
    }

    return marks;
}
