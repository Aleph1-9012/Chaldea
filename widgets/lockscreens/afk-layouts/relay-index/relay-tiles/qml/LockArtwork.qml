// SPDX-License-Identifier: 0BSD
import QtQuick
import "GlyphArt.js" as Art

Item {
    id: artwork
    property real phase: 0
    property int emphasis: 100
    implicitWidth: 252
    implicitHeight: 252
    clip: true
    Accessible.role: Accessible.Graphic
    Accessible.name: "Relay tiles. Artwork reacts to dummy-input length."
    onPhaseChanged: drawing.requestPaint()
    onEmphasisChanged: drawing.requestPaint()
    Canvas {
        id: drawing
        width: 1008
        height: 1008
        scale: artwork.width / 1008
        transformOrigin: Item.TopLeft
        onPaint: {
            const context = getContext("2d");
            context.reset();
            context.setTransform(4, 0, 0, 4, 0, 0);
            context.clearRect(0, 0, 252, 252);
            context.lineCap = "butt";
            context.lineJoin = "miter";
            for (const mark of Art.glyphMarks(artwork.phase, artwork.emphasis)) {
                context.globalAlpha = mark.alpha;
                if (mark.type === "rect") {
                    context.fillStyle = mark.c;
                    context.fillRect(mark.x, mark.y, mark.w, mark.h);
                } else {
                    context.strokeStyle = mark.c;
                    context.lineWidth = mark.w;
                    context.beginPath();
                    mark.points.forEach((point, index) => {
                        if (index) context.lineTo(point[0], point[1]);
                        else context.moveTo(point[0], point[1]);
                    });
                    context.stroke();
                }
            }
            context.globalAlpha = 1;
        }
    }
}
