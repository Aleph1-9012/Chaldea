// SPDX-License-Identifier: 0BSD
import QtQuick
import "GlyphArt.js" as Art

Item {
    id: artwork
    property real phase: 0
    implicitWidth: 252
    implicitHeight: 252
    clip: true
    Accessible.role: Accessible.Graphic
    Accessible.name: "Compound glyph. Dummy-input length changes the drawing; Backspace reverses it."
    onPhaseChanged: drawing.requestPaint()
    Canvas {
        id: drawing
        width: 504
        height: 504
        scale: artwork.width / 504
        transformOrigin: Item.TopLeft
        onPaint: {
            const context = getContext("2d");
            context.reset();
            context.setTransform(2, 0, 0, 2, 0, 0);
            context.lineCap = "butt";
            context.lineJoin = "miter";
            for (const mark of Art.glyphMarks(artwork.phase, 100)) {
                context.globalAlpha = mark.alpha;
                context.strokeStyle = mark.c;
                context.lineWidth = mark.w;
                context.beginPath();
                mark.points.forEach((point, index) => {
                    if (index) context.lineTo(point[0], point[1]);
                    else context.moveTo(point[0], point[1]);
                });
                context.stroke();
            }
            context.globalAlpha = 1;
        }
    }
}
