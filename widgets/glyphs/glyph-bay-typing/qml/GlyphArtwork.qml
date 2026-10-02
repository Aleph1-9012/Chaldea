// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import "GlyphArt.js" as Art

Item {
    id: artwork
    property real phase: 0
    property int emphasis: 100
    property string description: "Input-reactive glyph artwork"
    readonly property var baseGlyphs: Art.glyphBase()
    readonly property var trace: Art.glyphTrace(phase)
    readonly property real cellWidth: width / 18
    readonly property real cellHeight: height / 12
    implicitWidth: 252
    implicitHeight: 252
    clip: true
    Accessible.role: Accessible.Graphic
    Accessible.name: description
    Repeater {
        model: artwork.baseGlyphs
        delegate: Item {
            required property string modelData
            required property int index
            x: index % 18 * artwork.cellWidth
            y: Math.floor(index / 18) * artwork.cellHeight
            width: artwork.cellWidth; height: artwork.cellHeight
            clip: true
            GlyphText { anchors.centerIn: parent; text: parent.modelData; font.pixelSize: 22; color: "#6a665e"; wrapMode: Text.NoWrap }
        }
    }
    Repeater {
        model: 200
        delegate: Rectangle {
            id: piece
            required property int index
            readonly property var glyph: artwork.trace[index]
            x: glyph.x * artwork.cellWidth
            y: glyph.y * artwork.cellHeight
            width: artwork.cellWidth; height: artwork.cellHeight
            opacity: glyph.opacity
            visible: opacity > 0
            clip: true
            color: "#090909"
            GlyphText { anchors.centerIn: parent; text: piece.glyph.glyph; font.pixelSize: 22; color: piece.glyph.head ? "#f02b32" : "#d1161c"; wrapMode: Text.NoWrap }
        }
    }
}
