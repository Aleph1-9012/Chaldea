// SPDX-License-Identifier: 0BSD
import QtQuick
import "GlyphArt.js" as Art

Item {
    id: artwork
    property real phase: 0
    property int emphasis: 100
    property string description: "Input-reactive glyph artwork"
    implicitWidth: 252
    implicitHeight: 252
    clip: true
    Accessible.role: Accessible.Graphic
    Accessible.name: description
    onPhaseChanged: drawing.requestPaint()
    onEmphasisChanged: drawing.requestPaint()
    Canvas {
        id: drawing
        width: 756
        height: 756
        scale: artwork.width / 756
        transformOrigin: Item.TopLeft
        onPaint: {
            const context = getContext("2d");
            context.reset();
            context.setTransform(3, 0, 0, 3, 0, 0);
            context.fillStyle = "#090909";
            context.fillRect(0, 0, 252, 252);
            context.lineCap = "butt";
            context.lineJoin = "bevel";
            for (const mark of Art.glyphMarks(artwork.phase, artwork.emphasis)) {
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
