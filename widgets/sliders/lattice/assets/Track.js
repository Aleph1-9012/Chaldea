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
    const cells = [];

    for (let row = 0; row < 3; row++) {
        let previous = null;

        for (let column = 0; column * 11 < width; column++) {
            const x = column * 11 + 5.5;
            const y = 14 + row * 10;
            const odd = (column + row) % 2;
            const influence = Math.exp(-(((x - position) / 34) ** 2));
            const angle = ((odd ? 28 : -8) + (odd ? -1 : 1) * contact * 34 * influence) * Math.PI / 180;
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            let d = '';

            for (const [dx, dy] of [[-3.6, -3.6], [3.6, -3.6], [3.6, 3.6], [-3.6, 3.6]]) {
                d += `${d ? 'L' : 'M'}${x + dx * cosine - dy * sine} ${y + dx * sine + dy * cosine}`;
            }

            const left = [x - 3.6 * cosine, y - 3.6 * sine];
            const right = [x + 3.6 * cosine, y + 3.6 * sine];

            if (previous) {
                const connector = `M${previous[0]} ${previous[1]}L${left[0]} ${left[1]}`;
                idle.push(mark(connector, 'accent', false, .7, .6, 'track'));
                active.push(mark(connector, 'accent', false, .9, 1, 'active'));
            }

            cells.push({ d: `${d}Z`, tone: odd ? .82 : 1 });
            previous = right;
        }
    }

    for (const cell of cells) {
        idle.push(mark(cell.d, 'accent', false, .8, .6, 'track'));
        active.push(mark(cell.d, 'accent', true, 0, cell.tone, 'active'));
    }

    const height = 34 + contact * 4;

    return idle.concat(active, [
        rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'),
        rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
