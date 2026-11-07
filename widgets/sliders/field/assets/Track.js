// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function mark(d, role, fill, lineWidth, opacity, clip) {
    return { d, role, fill, lineWidth, opacity, clip };
}

function rectangle(x, y, width, height, role) {
    return mark(`M${x} ${y}h${width}v${height}h${-width}Z`, role, true, 0, 1, 'none');
}

function geometry(width, position, contact) {
    const idle = [];
    const active = [];

    for (let row = 0; row < 5; row++) {
        const y = 11 + row * 6.5;

        for (let x = 3.25; x < width; x += 6.5) {
            const distance = x - position;
            const influence = Math.exp(-((distance / (28 + contact * 7)) ** 2));
            const angle = Math.atan2((y - 24) * 1.5, Math.abs(distance) + 3) * Math.sign(distance) * influence * (.7 + contact * 1.25);
            const dx = Math.cos(angle) * 2.3;
            const dy = Math.sin(angle) * 2.3;
            const d = `M${x - dx} ${y - dy}L${x + dx} ${y + dy}`;
            idle.push(mark(d, 'accent', false, 1.2, .5, 'track'));
            active.push(mark(d, 'accent', false, 1.6, 1, 'active'));
        }
    }

    const height = 32 + contact * 6;

    return idle.concat(active, [
        rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'),
        rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
