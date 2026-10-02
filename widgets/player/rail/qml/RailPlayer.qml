// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

PlayerBase {
    id: root
    implicitWidth: 700
    implicitHeight: layout.implicitHeight + 2
    ColumnLayout {
        id: layout
        x: 1; y: 1
        width: parent.width - 2
        spacing: 0
        RowLayout {
            Layout.fillWidth: true; Layout.margins: 18
            PlayerText { Layout.fillWidth: true; text: "AUDIO // " + root.backend.sourceName; color: "#a09b96"; maximumLineCount: 1; elide: Text.ElideRight }
            PlayerText { text: root.backend.status; color: "#a09b96" }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        GridLayout {
            Layout.fillWidth: true; Layout.margins: 18
            columns: root.width < 560 ? 2 : 3
            columnSpacing: 20; rowSpacing: 18
            PlayerArtwork {
                Layout.preferredWidth: root.width < 560 ? 80 : 96
                Layout.preferredHeight: width
                source: root.backend.player ? root.backend.player.trackArtUrl : ""
                trackNumber: root.backend.trackNumber
                showArtwork: root.artworkEnabled
            }
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 8
                PlayerText { text: root.backend.trackNumber + " // TRACK"; color: "#cc1515" }
                PlayerText { Layout.fillWidth: true; text: root.backend.trackTitle; font.pixelSize: 23; maximumLineCount: 3; elide: Text.ElideRight }
                PlayerText { Layout.fillWidth: true; text: root.backend.artist; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
            }
            PlayerTransport {
                Layout.columnSpan: root.width < 560 ? 2 : 1
                Layout.fillWidth: root.width < 560
                Layout.preferredWidth: root.width < 560 ? -1 : 180
                backend: root.backend
            }
        }
        ColumnLayout {
            Layout.fillWidth: true; Layout.leftMargin: 18; Layout.rightMargin: 18; Layout.bottomMargin: 14
            spacing: 8
            PlayerButton { text: root.sourcesOpen ? "CLOSE SOURCES" : "SOURCES +"; onClicked: root.sourcesOpen = !root.sourcesOpen; Accessible.name: "Toggle connected players" }
            PlayerSeek { Layout.fillWidth: true; backend: root.backend }
            PlayerSources { visible: root.sourcesOpen; Layout.fillWidth: true; backend: root.backend }
        }
    }
}
