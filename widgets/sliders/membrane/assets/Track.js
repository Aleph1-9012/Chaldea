// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function mark(d, role, fill, lineWidth, opacity, clip) {
    return { d, role, fill, lineWidth, opacity, clip };
}

function rectangle(x, y, width, height, role) {
    return mark(`M${x} ${y}h${width}v${height}h${-width}Z`, role, true, 0, 1, false);
}

function geometry(width, position, contact) {
    const warp = (x, y) => 24 + (y - 24) * (1 + (.18 + contact * .45) * Math.exp(-(((x - position) / 26) ** 2)));
    const xs = [];

    for (let x = 0; x < width; x += 4) xs.push(x);

    xs.push(width);
    let outline = `M0 ${warp(0, 12)}`;

    for (const x of xs) outline += `L${x} ${warp(x, 12)}`;
    for (let index = xs.length - 1; index >= 0; index--) outline += `L${xs[index]} ${warp(xs[index], 36)}`;

    const idle = [];
    const active = [];

    for (let y = 12; y <= 36; y += 4) {
        let d = `M0 ${warp(0, y)}`;

        for (const x of xs) d += `L${x} ${warp(x, y)}`;

        idle.push(mark(d, 'accent', false, .7, .66, false));
        active.push(mark(d, 'paper', false, .7, .38, true));
    }

    for (let x = .5; x <= width; x += 5) {
        const d = `M${x} ${warp(x, 12)}V${warp(x, 36)}`;
        idle.push(mark(d, 'accent', false, .8, .66, false));
        active.push(mark(d, 'paper', false, .8, .38, true));
    }

    const height = 34 + contact * 8;

    return [mark(`${outline}Z`, 'accent', true, 0, 1, true)].concat(idle, active, [
        rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'),
        rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'),
    ]);
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
