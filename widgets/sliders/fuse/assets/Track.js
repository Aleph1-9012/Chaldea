// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function rectangle(x, y, width, height, role, opacity = 1, clip = 'none') {
    const span = Math.max(0, width);

    return { d: `M${x} ${y}h${span}v${height}h${-span}Z`, role, fill: true, lineWidth: 0, opacity, clip };
}

function smooth(value) {
    const t = Math.max(0, Math.min(1, value));

    return t * t * (3 - 2 * t);
}

function geometry(width, position, contact) {
    const idle = [];
    const active = [rectangle(0, 10, position - 28, 28, 'accent', 1, 'active')];

    for (let column = 0; column * 7 < width; column++) {
        const x = column * 7 + 3.5;
        const merge = smooth((position - x + 12) / 40);
        const pressure = contact * Math.exp(-(((x - position) / 22) ** 2));

        for (let row = 0; row < 4; row++) {
            const seed = (column * 7 + row * 3) % 5;
            const grain = 1.7 + seed * .32;
            const size = Math.min(7.05, grain + (7.05 - grain) * merge + pressure * 1.7);
            const y = 13.5 + row * 7;
            idle.push(rectangle(x - size / 2, y - size / 2, size, size, 'accent', .45 + merge * .15, 'track'));
            active.push(rectangle(x - size / 2, y - size / 2, size, size, 'accent', 1, 'active'));
        }
    }

    const height = 34 + contact * 4;

    return idle.concat(active, [
        rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'),
        rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
