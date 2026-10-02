// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

PlayerBase {
    id: root
    implicitWidth: 660
    implicitHeight: layout.implicitHeight + 44
    Rectangle { x: 21; width: 66; height: 3; color: "#cc1515" }
    ColumnLayout {
        id: layout
        x: 22; y: 22
        width: parent.width - 44
        spacing: 16
        RowLayout {
            Layout.fillWidth: true
            PlayerText { text: "TSUGUMORI // AUDIO"; Layout.fillWidth: true }
            PlayerText { text: root.backend.sourceName; color: "#a09b96"; Layout.maximumWidth: root.width * .3; maximumLineCount: 1; elide: Text.ElideRight }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        RowLayout {
            Layout.fillWidth: true
            spacing: root.width < 430 ? 12 : 22
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 18
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 11
                        PlayerText { text: "TRACK / " + root.backend.trackNumber; color: "#cc1515" }
                        PlayerText { Layout.fillWidth: true; text: root.backend.album; color: "#a09b96"; maximumLineCount: 3; elide: Text.ElideRight }
                    }
                    Rectangle {
                        Layout.preferredWidth: 72; Layout.preferredHeight: 94
                        color: "#101010"; border.color: "#635b56"
                        PlayerArtwork {
                            x: 5; y: 5; width: 62; height: 62
                            source: root.backend.player ? root.backend.player.trackArtUrl : ""
                            trackNumber: root.backend.trackNumber
                            showArtwork: root.artworkEnabled
                        }
                        PlayerText { x: 5; y: 74; width: 62; text: "音楽 / " + root.backend.trackNumber; horizontalAlignment: Text.AlignHCenter; color: "#a09b96" }
                    }
                }
                PlayerText { Layout.fillWidth: true; text: root.backend.trackTitle; font.pixelSize: root.width < 430 ? 34 : 66; font.letterSpacing: -2; maximumLineCount: 4; elide: Text.ElideRight }
                PlayerText { Layout.fillWidth: true; text: root.backend.artist; font.pixelSize: 14; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
            }
            Rectangle { implicitWidth: 1; Layout.fillHeight: true; color: root.lineColor }
            PlayerTransport { Layout.minimumWidth: 62; Layout.maximumWidth: 62; Layout.preferredWidth: 62; Layout.alignment: Qt.AlignBottom; vertical: true; backend: root.backend }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: "#68605a" }
        PlayerSeek { Layout.fillWidth: true; backend: root.backend; ruler: true }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        RowLayout {
            Layout.fillWidth: true
            PlayerText { text: root.backend.status; Layout.fillWidth: true }
            PlayerButton { text: root.sourcesOpen ? "CLOSE" : "SOURCES"; onClicked: root.sourcesOpen = !root.sourcesOpen; Accessible.name: "Toggle connected players" }
        }
        PlayerSources { visible: root.sourcesOpen; Layout.fillWidth: true; backend: root.backend }
    }
}
