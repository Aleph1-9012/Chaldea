// SPDX-License-Identifier: 0BSD
// Shared by the browser SVG and the native Qt Quick vector drawing.
function mark(d, role, fill, lineWidth, opacity, clip) {
    return { d, role, fill, lineWidth, opacity, clip };
}

function rectangle(x, y, width, height, role) {
    return mark(`M${x} ${y}h${width}v${height}h${-width}Z`, role, true, 0, 1, 'none');
}

function smooth(value) {
    const t = Math.max(0, Math.min(1, value));

    return t * t * (3 - 2 * t);
}

function geometry(width, position, contact) {
    const paths = [];
    const wave = Math.PI * 2 / 38;
    const strandY = (x, strand) => {
        const blend = 1 - smooth((x - position + 10) / 34);
        const phase = x * wave + strand * Math.PI * 2 / 3;
        const laid = 24 + (strand - 1) * 8;
        const twisted = 24 + Math.sin(phase) * 10;
        const separation = (strand - 1) * contact * 3 * Math.exp(-(((x - position) / 16) ** 2));

        return laid + (twisted - laid) * blend + separation;
    };

    for (let strand = 0; strand < 3; strand++) {
        let d = `M0 ${strandY(0, strand)}`;

        for (let x = 2; x < width; x += 2) d += `L${x} ${strandY(x, strand)}`;

        d += `L${width} ${strandY(width, strand)}`;
        paths.push(mark(d, 'accent', false, 1.6, .5, 'track'));
    }

    for (let start = 0; start < width; start += 8) {
        const end = Math.min(width, start + 8);
        const order = [0, 1, 2];
        order.sort((a, b) => Math.cos((start + 4) * wave + a * Math.PI * 2 / 3) - Math.cos((start + 4) * wave + b * Math.PI * 2 / 3));

        for (const strand of order) {
            let d = `M${start} ${strandY(start, strand)}`;

            for (let x = start + 2; x < end; x += 2) d += `L${x} ${strandY(x, strand)}`;

            d += `L${end} ${strandY(end, strand)}`;
            paths.push(mark(d, 'paper', false, 5, 1, 'active'));
            paths.push(mark(d, 'accent', false, 2.5, strand === 1 ? .8 : 1, 'active'));
        }
    }

    const height = 28 + contact * 8;
    paths.push(rectangle(position - 3.5, 23 - height / 2, 7, height + 2, 'paper'));
    paths.push(rectangle(position - 1.5, 24 - height / 2, 3, height, 'text'));

    return paths;
}

if (typeof window !== 'undefined') window.ContactTrack = { geometry };
