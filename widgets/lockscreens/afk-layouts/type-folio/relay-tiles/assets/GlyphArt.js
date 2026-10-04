// SPDX-License-Identifier: 0BSD
// Selected Relay tiles drawing rules from the original preview.
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));

const lerp = (from, to, amount) => from + (to - from) * amount;

const smooth = value => {
    const t = clamp(value);

    return t * t * (3 - 2 * t);
};

function hash(x, y, seed = 0) {
    let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed + 1, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);

    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const ranks = (() => {
    const ordered = Array.from({ length: 64 }, (_, i) => i).sort((a, b) => hash(a % 8, Math.floor(a / 8), 4) - hash(b % 8, Math.floor(b / 8), 4));
    const rank = [];
    ordered.forEach((cell, i) => rank[cell] = i);

    return rank;
})();

function glyphMarks(p, emphasis) {
    const marks = [];
    const colour = value => {
        const t = clamp(value * emphasis / 100), a = [83, 79, 72], b = [209, 22, 28];

        return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
    };
    const path = (points, c, w) => marks.push({ type: 'path', points, c, w, alpha: 1 });
    const rect = (x, y, w, h, c) => marks.push({ type: 'rect', x, y, w, h, c, alpha: 1 });
    const transform = (points, cx, cy, angle) => points.map(([x, y]) => [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);
    const cell = 29;

    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
            const rank = ranks[y * 8 + x], cx = 24.5 + x * cell, cy = 24.5 + y * cell;
            const offset = rank % 12;
            const step = Math.floor(p / 12), local = clamp(p - step * 12 - offset);
            const angle = (Math.floor(hash(x, y, 2) * 4) + step + smooth(local)) * Math.PI / 2;
            const power = smooth((p * 3 + 9 - rank) / 3);
            const c = colour(power);
            const one = [[-14.5, 0], [-8, 0], [-8, -8], [0, -8], [0, -14.5]];
            const two = [[0, 14.5], [0, 8], [8, 8], [8, 0], [14.5, 0]];
            path(transform(one, cx, cy, angle), c, 1.35);
            path(transform(two, cx, cy, angle), c, 1.35);
            rect(cx - 1, cy - 1, 2, 2, power > .5 ? '#d1161c' : '#282724');
        }

    return marks;
}
