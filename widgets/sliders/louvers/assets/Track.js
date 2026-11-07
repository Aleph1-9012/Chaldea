// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function mark(d, role, fill, lineWidth, opacity, clip) {
    return { d, role, fill, lineWidth, opacity, clip };
}

function rectangle(x, y, width, height, role) {
    return mark(`M${x} ${y}h${width}v${height}h${-width}Z`, role, true, 0, 1, false);
}

function geometry(width, position, contact) {
    const idle = [];
    const active = [];
    const withinTrack = x => Math.max(0, Math.min(width, x));

    for (let x = 4; x < width; x += 10) {
        const distance = x - position;
        const influence = Math.exp(-((distance / 32) ** 2));
        const tilt = Math.sign(distance) * (5 + contact * 7) * influence;
        const halfHeight = 12 + influence * (1 + contact * 5);
        const d = `M${withinTrack(x - 3 + tilt)} ${24 - halfHeight}L${withinTrack(x + 3 + tilt)} ${24 - halfHeight}L${withinTrack(x + 3 - tilt)} ${24 + halfHeight}L${withinTrack(x - 3 - tilt)} ${24 + halfHeight}Z`;
        idle.push(mark(d, 'accent', false, .8, .6, false));
        active.push(mark(d, 'accent', true, 0, 1, true));
    }

    const height = 34 + contact * 4;

    return idle.concat(active, [
        rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'),
        rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
