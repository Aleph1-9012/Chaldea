// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

PlayerBase {
    id: root
    implicitWidth: 630
    implicitHeight: layout.implicitHeight + 2
    ColumnLayout {
        id: layout
        x: 1; y: 1
        width: parent.width - 2
        spacing: 0
        RowLayout {
            Layout.fillWidth: true; Layout.margins: 18
            PlayerText { Layout.fillWidth: true; text: "Track ledger"; font.pixelSize: 19 }
            PlayerText { text: "TSUGUMORI // AUDIO"; color: "#a09b96"; visible: root.width >= 420 }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        GridLayout {
            Layout.fillWidth: true
            columns: root.width < 420 ? 1 : 2
            columnSpacing: 0; rowSpacing: 0
            Item {
                Layout.preferredWidth: root.width < 420 ? -1 : 154
                Layout.minimumWidth: root.width < 420 ? 0 : 154
                Layout.maximumWidth: root.width < 420 ? Infinity : 154
                Layout.fillWidth: root.width < 420
                Layout.alignment: Qt.AlignTop
                implicitHeight: albumContent.implicitHeight + 30
                Rectangle { visible: root.width >= 420; anchors.right: parent.right; width: 1; height: parent.height; color: root.lineColor }
                GridLayout {
                    id: albumContent
                    x: 15; y: 15
                    width: parent.width - 30
                    columns: root.width < 420 ? 2 : 1
                    columnSpacing: 14; rowSpacing: 16
                    PlayerArtwork {
                        Layout.preferredWidth: root.width < 420 ? 80 : 124
                        Layout.preferredHeight: root.width < 420 ? 80 : 124
                        source: root.backend.player ? root.backend.player.trackArtUrl : ""
                        trackNumber: root.backend.trackNumber
                        showArtwork: root.artworkEnabled
                    }
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 7
                        PlayerText { text: "NOW SELECTED"; color: "#a09b96" }
                        PlayerText { Layout.fillWidth: true; text: root.backend.album; font.pixelSize: 12; maximumLineCount: 3; elide: Text.ElideRight }
                        PlayerText { Layout.fillWidth: true; text: root.backend.artist; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
                        PlayerText { Layout.fillWidth: true; Layout.topMargin: 10; text: root.backend.sourceName; color: "#cc1515"; maximumLineCount: 2; elide: Text.ElideRight }
                    }
                }
            }
            ColumnLayout {
                Layout.fillWidth: true; Layout.margins: 14
                spacing: 14
                PlayerSources { Layout.fillWidth: true; backend: root.backend }
                Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
                PlayerText { Layout.fillWidth: true; text: root.backend.status; color: "#a09b96" }
                PlayerTransport { Layout.fillWidth: true; backend: root.backend }
                PlayerSeek { Layout.fillWidth: true; backend: root.backend }
            }
        }
    }
}
