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
        width: 504
        height: 504
        scale: artwork.width / 504
        transformOrigin: Item.TopLeft
        onPaint: {
            const context = getContext("2d");
            context.reset();
            context.setTransform(2, 0, 0, 2, 0, 0);
            context.fillStyle = "#090909";
            context.fillRect(0, 0, 252, 252);
            context.save();
            context.beginPath();
            context.rect(0, 0, 252, 252);
            context.clip();
            context.lineCap = "butt";
            context.lineJoin = "miter";

            for (const mark of Art.glyphMarks(artwork.phase, artwork.emphasis)) {
                context.save();
                context.globalAlpha = mark.alpha;
                context.fillStyle = mark.c;
                context.strokeStyle = mark.c;

                if (mark.type === "rect") {
                    context.fillRect(mark.x, mark.y, mark.w, mark.h);
                } else if (mark.type === "path") {
                    context.beginPath();

                    for (let index = 0; index < mark.points.length; index++) {
                        const point = mark.points[index];

                        if (index) context.lineTo(point[0], point[1]);
                        else context.moveTo(point[0], point[1]);
                    }

                    context.lineWidth = mark.w;
                    context.stroke();
                } else if (mark.type === "text") {
                    context.beginPath();
                    context.rect(mark.clip[0], mark.clip[1], mark.clip[2], mark.clip[3]);
                    context.clip();
                    context.font = '500 ' + mark.size + 'px "' + mark.family + '", sans-serif';
                    context.textAlign = "center";
                    context.textBaseline = "alphabetic";
                    context.fillText(mark.value, mark.x, mark.y);
                }

                context.restore();
            }

            context.restore();
            context.globalAlpha = 1;
        }
    }
}
