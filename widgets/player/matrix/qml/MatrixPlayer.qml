// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

PlayerBase {
    id: root
    implicitHeight: layout.implicitHeight + 2
    ColumnLayout {
        id: layout
        x: 1; y: 1
        width: parent.width - 2
        spacing: 0
        RowLayout {
            Layout.fillWidth: true
            Layout.margins: 18
            PlayerText { text: "NR-2B // AUDIO"; color: "#cc1515"; Layout.fillWidth: true }
            PlayerText { text: "TYPE 17"; color: "#a09b96" }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        RowLayout {
            Layout.fillWidth: true
            spacing: 0
            ColumnLayout {
                Layout.preferredWidth: root.width * .46 - (root.width < 470 ? 20 : 30)
                Layout.maximumWidth: Layout.preferredWidth
                Layout.minimumWidth: Layout.preferredWidth
                Layout.fillHeight: true
                Layout.margins: root.width < 470 ? 10 : 15
                spacing: 12
                PlayerArtwork {
                    Layout.fillWidth: true
                    Layout.preferredHeight: width
                    source: root.backend.player ? root.backend.player.trackArtUrl : ""
                    trackNumber: root.backend.trackNumber
                    showArtwork: root.artworkEnabled
                    matrix: true
                }
                PlayerText { Layout.fillWidth: true; text: "GLYPH / " + root.backend.trackNumber + "     32 × 32"; color: "#a09b96" }
                Item { Layout.fillHeight: true }
            }
            Rectangle { implicitWidth: 1; Layout.fillHeight: true; color: root.lineColor }
            ColumnLayout {
                Layout.fillWidth: true
                Layout.minimumWidth: 0
                Layout.fillHeight: true
                Layout.margins: root.width < 470 ? 12 : 22
                spacing: 12
                PlayerText { Layout.fillWidth: true; text: root.backend.status + " // " + root.backend.sourceName; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
                PlayerText { Layout.fillWidth: true; text: root.backend.trackTitle; font.pixelSize: root.width < 470 ? 25 : 40; maximumLineCount: 4; elide: Text.ElideRight }
                PlayerText { Layout.fillWidth: true; text: root.backend.artist; font.pixelSize: 13; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
                Item { Layout.fillHeight: true; Layout.minimumHeight: 18 }
                PlayerText { text: root.backend.trackNumber; font.pixelSize: root.width < 470 ? 34 : 47; color: "#665b55" }
                PlayerText { Layout.fillWidth: true; text: root.backend.album; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
            }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        ColumnLayout {
            Layout.fillWidth: true
            Layout.margins: 18
            spacing: 16
            PlayerSeek { Layout.fillWidth: true; backend: root.backend; ruler: true }
            GridLayout {
                Layout.fillWidth: true
                columns: root.width < 470 ? 1 : 2
                rowSpacing: 8; columnSpacing: 8
                PlayerTransport { Layout.fillWidth: true; backend: root.backend }
                PlayerButton { text: root.sourcesOpen ? "CLOSE" : "SOURCES"; Layout.fillWidth: root.width < 470; onClicked: root.sourcesOpen = !root.sourcesOpen; Accessible.name: "Toggle connected players" }
            }
            PlayerSources { visible: root.sourcesOpen; Layout.fillWidth: true; backend: root.backend }
        }
    }
}
