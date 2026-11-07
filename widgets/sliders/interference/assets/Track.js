// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function mark(d, role, fill, lineWidth, opacity, clip) {
    return { d, role, fill, lineWidth, opacity, clip };
}

function rectangle(x, y, width, height, role, clip = 'none') {
    return mark(`M${x} ${y}h${width}v${height}h${-width}Z`, role, true, 0, 1, clip);
}

function geometry(width, position, contact) {
    const idle = [];
    const active = [rectangle(0, 10, width, 28, 'accent', 'active')];

    for (const direction of [-1, 1]) {
        for (let origin = -12; origin <= width + 12; origin += 6) {
            const influence = Math.exp(-(((origin - position) / 44) ** 2));
            let d = '';

            for (let y = 10; y <= 38; y += 2) {
                const shift = influence * (1.6 + contact * 4) * Math.cos((y - 24) / 20) * direction;
                const x = origin + (y - 24) * .28 * direction + shift;
                d += `${d ? 'L' : 'M'}${x} ${y}`;
            }

            idle.push(mark(d, 'accent', false, .8, direction === -1 ? .7 : .48, 'track'));
            active.push(mark(d, 'paper', false, direction === -1 ? 1.1 : 1.4, .95, 'active'));
        }
    }

    return idle.concat(active, [
        rectangle(position - 3.5, 6, 7, 36, 'paper'),
        rectangle(position - 1.5, 7, 3, 34, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
