// SPDX-License-Identifier: 0BSD
// Oblique ligatures, shared by the browser preview and native QML.
const clamp = value => Math.min(1, Math.max(0, value));

const lerp = (from, to, amount) => from + (to - from) * amount;

const smooth = value => {
    const amount = clamp(value);

    return amount * amount * (3 - 2 * amount);
};

function hash(x, y, seed = 0) {
    let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed + 1, 1442695041);
    value = Math.imul(value ^ (value >>> 13), 1274126177);

    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function glyphColour(amount, emphasis) {
    const tint = clamp(amount * emphasis / 100);
    const paper = [130, 125, 115], red = [209, 22, 28];

    return `rgb(${paper.map((value, index) => Math.round(lerp(value, red[index], tint))).join(',')})`;
}

const lines = [
    [2, 1, 2, 3, 2],
    [1, 3, 2, 1, 2, 1],
    [3, 2, 1, 2, 2],
    [2, 1, 1, 3, 1, 2],
    [1, 2, 3, 1, 3]
];

const glyphCount = lines.reduce((total, row) => total + row.length, 0);

function glyphResponse(phase, index) {
    const pass = Math.floor(phase / glyphCount);
    const progress = pass + clamp(phase - pass * glyphCount - index);
    const distance = (phase - index) % glyphCount;
    const focus = smooth(distance) * (1 - smooth(distance - 1));

    return { progress, focus };
}

// Critically damped motion retains velocity on retargeting without overshooting.
function advanceGlyphMotion(phase, velocity, target, elapsed, duration) {
    const offset = phase - target;
    const speed = 10 / Math.max(.08, duration / 1000);
    const direction = Math.sign(-offset);
    const carried = direction * Math.min(Math.max(0, velocity * direction), speed * Math.abs(offset));
    const time = Math.max(0, elapsed);
    const drift = carried + speed * offset;
    const decay = Math.exp(-speed * time);
    const next = target + (offset + drift * time) * decay;
    const nextVelocity = (carried - speed * drift * time) * decay;

    if (Math.abs(next - target) < .0001 && Math.abs(nextVelocity) < .01)
        return { phase: target, velocity: 0 };

    return { phase: next, velocity: nextVelocity };
}

function glyphMarks(phase, emphasis) {
    const marks = [];
    const path = (points, tint = 0, width = 1, alpha = 1) => marks.push({ type: 'path', points, c: glyphColour(tint, emphasis), w: width, alpha });

    function radical(cx, cy, width, height, key, depth, progress, focus) {
        const rest = hash(key, depth, 41) * 3;
        const restStep = Math.floor(rest);
        const restAmount = smooth(rest - restStep);
        const step = Math.floor(progress);
        const fraction = progress - step;
        const amount = depth ? smooth((fraction - .1) / .9) : smooth(fraction);
        const articulation = lerp(step % 2, (step + 1) % 2, amount);
        const sample = seed => {
            const initial = lerp(hash(key, restStep, seed), hash(key, restStep + 1, seed), restAmount);
            const latched = initial < .5 ? .94 : .06;

            return lerp(initial, latched, articulation);
        };
        const lean = -.22;
        const project = points => points.map(([x, y]) => [cx + x + y * lean, cy + y]);
        const stroke = (points, tint = 0, weight = 1, alpha = 1) => path(project(points), tint, weight, alpha);
        const left = -width / 2, right = width / 2;
        const top = -height / 2, bottom = height / 2;
        const seam = width * lerp(-.18, .18, sample(17));
        const upper = height * lerp(-.28, -.1, sample(23));
        const lower = height * lerp(.12, .3, sample(29));
        const tint = lerp(smooth((.21 - hash(key, depth, 61)) / .22), 1, focus * .8);
        const weight = depth ? .72 : 1.1;

        const variant = Math.floor(hash(key, depth, 83) * 4);

        if (variant === 0) {
            stroke([[left, top], [seam, top], [seam, upper], [right, upper]], tint, weight);
            stroke([[right, bottom], [seam, bottom], [seam, lower], [left, lower]], tint * .7, weight);
            stroke([[left, upper], [left, lower], [seam - width * .12, lower]], tint * .35, weight, .9);
            stroke([[right, lower], [right, upper], [seam + width * .12, upper]], tint, weight, .9);
        } else if (variant === 1) {
            stroke([[left, lower], [left, top], [seam, top], [seam, upper], [right, upper]], tint, weight);
            stroke([[right, upper], [right, bottom], [seam, bottom], [seam, lower], [left, lower]], tint * .7, weight);
        } else if (variant === 2) {
            stroke([[left, top], [right, top], [right, upper], [seam, upper], [seam, bottom], [left, bottom]], tint, weight);
            stroke([[left, lower], [left, upper], [seam - width * .12, upper]], tint * .7, weight);
            stroke([[right, lower], [right, bottom], [seam + width * .12, bottom]], tint * .35, weight, .85);
        } else {
            stroke([[left, top], [seam, top], [seam, 0], [right, 0], [right, bottom], [seam, bottom]], tint, weight);
            stroke([[left, bottom], [left, lower], [seam, lower], [seam, upper], [right, upper], [right, top]], tint * .7, weight);
        }

        stroke([[seam - width * .18, top], [seam - width * .18, upper - height * .1], [left + width * .12, upper - height * .1]], tint * .7, weight * .8, .8);
        stroke([[seam + width * .18, bottom], [seam + width * .18, lower + height * .1], [right - width * .12, lower + height * .1]], tint, weight * .8, .8);

        if (!depth) {
            const count = Math.max(1, Math.floor(width / 15));
            const pitch = width / count;

            for (let index = 0; index < count; index++) {
                const x = left + pitch * (index + .5);
                const initial = smooth((.35 - hash(key, index, 79)) / .4);
                const split = lerp(initial, 1 - initial, articulation);
                const y = lerp(-height * .02, height * .1, split);
                radical(cx + x + y * lean, cy + y, pitch * .58, height * .29, key * 7 + index + 1, 1, progress, focus);
            }

            if (width > 30) {
                stroke([[left + width * .15, top + height * .17], [left + width * .36, top + height * .17], [left + width * .36, upper]], tint, .75, .85);
                stroke([[right - width * .15, bottom - height * .17], [right - width * .36, bottom - height * .17], [right - width * .36, lower]], tint * .5, .75, .85);
            }
        }

        const ports = project([[left, lower], [right, upper]]);

        return { entry: ports[0], exit: ports[1] };
    }

    let ordinal = 0;

    for (let row = 0; row < lines.length; row++) {
        let left = 6;
        let previous;

        for (let index = 0; index < lines[row].length; index++) {
            const span = lines[row][index] * 24;
            const key = row * 11 + index + 1;
            const cy = 30 + row * 48;
            const response = glyphResponse(phase, ordinal++);
            const ports = radical(left + span / 2, cy, span - 12, 36, key, 0, response.progress, response.focus);

            if (previous) {
                const middle = (previous[0] + ports.entry[0]) / 2;
                path([previous, [middle, previous[1]], [middle, ports.entry[1]], ports.entry], response.focus, .7, .55 + response.focus * .3);
            }

            previous = ports.exit;

            left += span;
        }
    }

    return marks;
}
