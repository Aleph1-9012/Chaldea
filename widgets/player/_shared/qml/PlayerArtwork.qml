// SPDX-License-Identifier: 0BSD
import QtQuick

Canvas {
    id: artwork
    property url source: ""
    property bool showArtwork: true
    property bool matrix: false
    property bool revealOnHover: false
    property string trackNumber: "--"
    property url loadedSource: ""
    implicitWidth: 280
    implicitHeight: width
    renderStrategy: Canvas.Immediate
    onWidthChanged: requestPaint()
    onHeightChanged: requestPaint()
    Accessible.role: Accessible.Graphic
    Accessible.name: matrix ? "Album artwork as a glyph matrix" : "Album artwork"
    function refresh(): void {
        if (loadedSource && loadedSource !== source) unloadImage(loadedSource);
        loadedSource = source;
        if (showArtwork && source) loadImage(source);
        requestPaint();
    }
    onSourceChanged: refresh()
    onShowArtworkChanged: refresh()
    onTrackNumberChanged: requestPaint()
    onImageLoaded: requestPaint()
    Component.onCompleted: refresh()
    HoverHandler { id: hover; onHoveredChanged: artwork.requestPaint() }
    onPaint: {
        const ctx = getContext("2d");
        ctx.reset();
        const size = Math.max(1, Math.floor(Math.min(width, height)));
        ctx.fillStyle = "#101010";
        ctx.fillRect(0, 0, width, height);
        if (showArtwork && source && isImageLoaded(source) && !isImageError(source)) {
            ctx.drawImage(source, 0, 0, size, size);
            const pixels = ctx.getImageData(0, 0, size, size);
            if (matrix) {
                ctx.fillStyle = "#090909";
                ctx.fillRect(0, 0, width, height);
                ctx.font = (size / 32 * .9) + "px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const glyphs = " .·:+x*#@";
                for (let row = 0; row < 32; row++) {
                    for (let col = 0; col < 32; col++) {
                        const x = (col + .5) * size / 32, y = (row + .5) * size / 32;
                        const p = (Math.floor(y) * size + Math.floor(x)) * 4;
                        const r = pixels.data[p], g = pixels.data[p + 1], b = pixels.data[p + 2];
                        const tone = Math.min(1, Math.max(0, ((r * .3 + g * .59 + b * .11) / 255 - .025) / .47));
                        const k = Math.min(8, Math.floor(Math.pow(tone, .65) * 8));
                        ctx.fillStyle = r > g * 1.45 && r > 65 ? "#e13a2c" : Qt.rgba(.91, .91, .88, .22 + Math.sqrt(tone) * .72);
                        ctx.fillText(glyphs[k], x, y);
                    }
                }
            } else if (!(revealOnHover && hover.hovered)) {
                for (let i = 0; i < pixels.data.length; i += 4) {
                    const gray = pixels.data[i] * .3 + pixels.data[i + 1] * .59 + pixels.data[i + 2] * .11;
                    pixels.data[i] = gray; pixels.data[i + 1] = gray; pixels.data[i + 2] = gray;
                }
                ctx.putImageData(pixels, 0, 0, 0, 0, size, size);
            }
        } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "#54443c";
            ctx.font = (size * .31) + "px monospace";
            ctx.fillText(trackNumber, size / 2, size * .56);
            ctx.fillStyle = "#b9afa6";
            ctx.font = (size * .041) + "px monospace";
            ctx.fillText("NO COVER ART", size / 2, size * .67);
        }
    }
}
