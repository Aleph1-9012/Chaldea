// SPDX-License-Identifier: 0BSD
// The same fixed route and glyph connections are used in HTML and QML.
const symbols = ['│', '┌', '·', '╱', '┤', '└', ' ', '─', '┬', '╲', '┐', '│', ' ', '┴'];

// A fixed, closed route through all 216 cells. Neighboring cells always share
// an edge, including the last-to-first step. It is unrelated to typed text.
const route = [
    [12, 3], [13, 3], [14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [15, 7], [15, 6], [15, 5], [16, 5], [16, 6],
    [16, 7], [16, 8], [15, 8], [14, 8], [14, 9], [15, 9], [16, 9], [17, 9], [17, 8], [17, 7], [17, 6], [17, 5],
    [17, 4], [16, 4], [15, 4], [15, 3], [16, 3], [17, 3], [17, 2], [16, 2], [15, 2], [14, 2], [13, 2], [13, 1],
    [14, 1], [15, 1], [16, 1], [17, 1], [17, 0], [16, 0], [15, 0], [14, 0], [13, 0], [12, 0], [12, 1], [12, 2],
    [11, 2], [11, 1], [11, 0], [10, 0], [10, 1], [10, 2], [9, 2], [9, 1], [9, 0], [8, 0], [7, 0], [6, 0],
    [6, 1], [7, 1], [8, 1], [8, 2], [7, 2], [6, 2], [6, 3], [6, 4], [5, 4], [5, 3], [5, 2], [4, 2],
    [3, 2], [2, 2], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [5, 0], [4, 0], [3, 0], [2, 0],
    [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 7], [1, 6], [1, 5],
    [1, 4], [1, 3], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [1, 8], [0, 8], [0, 9], [1, 9],
    [2, 9], [2, 10], [1, 10], [0, 10], [0, 11], [1, 11], [2, 11], [3, 11], [3, 10], [3, 9], [4, 9], [4, 10],
    [4, 11], [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11],
    [16, 11], [17, 11], [17, 10], [16, 10], [15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [11, 9], [11, 8], [10, 8],
    [10, 9], [10, 10], [9, 10], [8, 10], [7, 10], [7, 9], [7, 8], [6, 8], [6, 9], [6, 10], [5, 10], [5, 9],
    [5, 8], [4, 8], [3, 8], [3, 7], [3, 6], [3, 5], [3, 4], [3, 3], [4, 3], [4, 4], [4, 5], [5, 5],
    [6, 5], [6, 6], [5, 6], [4, 6], [4, 7], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5], [7, 4], [7, 3],
    [8, 3], [8, 4], [8, 5], [9, 5], [10, 5], [10, 6], [9, 6], [8, 6], [8, 7], [8, 8], [8, 9], [9, 9],
    [9, 8], [9, 7], [10, 7], [11, 7], [11, 6], [11, 5], [12, 5], [12, 6], [12, 7], [12, 8], [12, 9], [13, 9],
    [13, 8], [13, 7], [13, 6], [13, 5], [13, 4], [12, 4], [11, 4], [10, 4], [9, 4], [9, 3], [10, 3], [11, 3]
];

const maxTrails = 8;

const maxSegments = 25;

function routePoint(index) {
    return route[((index % route.length) + route.length) % route.length];
}

function direction(from, to) {
    if (to[0] > from[0])
        return 'R';

    if (to[0] < from[0])
        return 'L';

    return to[1] > from[1] ? 'D' : 'U';
}

const lineGlyphs = { LR: '─', DU: '│', DR: '┌', DL: '┐', RU: '└', LU: '┘', L: '╴', R: '╶', U: '╵', D: '╷' };

const clampUnit = value => Math.max(0, Math.min(1, value));

function glyphBase() {
    const field = [];

    for (let row = 0; row < 12; row++)
        for (let col = 0; col < 18; col++)
            field.push(symbols[(row * 19 + col * 7 + col * row) % symbols.length]);

    return field;
}

function glyphTrace(phase) {
    const wholePhase = Math.floor(phase);
    const fraction = phase - wholePhase;
    const trailLength = Math.min(maxSegments, 6 + phase);
    const pieces = [];

    for (let trail = 0; trail < maxTrails; trail++)
        for (let segment = 0; segment < maxSegments; segment++) {
            const piece = { trail, segment };
            const head = wholePhase + piece.trail * (route.length / maxTrails);
            const index = head - piece.segment;
            const point = routePoint(index);
            const nextPoint = routePoint(index + 1);
            // Interpolate along one grid edge at a time, even when a paste, selection
            // deletion, or interrupted animation crosses several corners.
            const x = point[0] + (nextPoint[0] - point[0]) * fraction;
            const y = point[1] + (nextPoint[1] - point[1]) * fraction;
            const connections = [];

            if (piece.segment > 0)
                connections.push(direction(point, routePoint(index + 1)));

            if (piece.segment < Math.ceil(trailLength) - 1)
                connections.push(direction(point, routePoint(index - 1)));

            const trailOpacity = piece.trail === 0 ? 1 : clampUnit(phase - piece.trail * 3 + 1);
            const tailOpacity = clampUnit(trailLength - piece.segment);
            pieces.push({ x, y, glyph: lineGlyphs[connections.sort().join('')] || '─', opacity: trailOpacity * tailOpacity, head: piece.segment === 0 });
        }

    return pieces;
}
