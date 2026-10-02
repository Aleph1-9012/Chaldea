// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

PlayerBase {
    id: root
    implicitWidth: 360
    implicitHeight: layout.implicitHeight + 34
    Rectangle { x: 28; width: 1; height: parent.height; color: root.lineColor }
    PlayerText {
        x: 21; y: 16; width: 200; height: 14
        rotation: 90
        transformOrigin: Item.TopLeft
        text: "TSUGUMORI // AUDIO"
        color: "#a09b96"
        wrapMode: Text.NoWrap
    }
    PlayerText { x: 5; anchors.bottom: parent.bottom; anchors.bottomMargin: 16; text: root.backend.trackNumber }
    ColumnLayout {
        id: layout
        x: 45; y: 17
        width: parent.width - 62
        spacing: 12
        RowLayout {
            Layout.fillWidth: true
            PlayerText { text: "ARCHIVE"; Layout.fillWidth: true }
            PlayerText { text: "音楽"; color: "#a09b96" }
        }
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: width
            color: "#101010"; border.color: "#69605b"
            PlayerArtwork {
                anchors.fill: parent; anchors.margins: 8
                source: root.backend.player ? root.backend.player.trackArtUrl : ""
                trackNumber: root.backend.trackNumber
                showArtwork: root.artworkEnabled
                revealOnHover: true
            }
            Rectangle { anchors.top: parent.top; anchors.right: parent.right; width: 25; height: 3; color: "#cc1515" }
        }
        RowLayout {
            Layout.fillWidth: true
            PlayerText { text: "AUDIO // " + root.backend.trackNumber; Layout.fillWidth: true; color: "#a09b96" }
            PlayerText { text: root.backend.status; color: "#a09b96" }
        }
        PlayerText { Layout.fillWidth: true; Layout.topMargin: 10; text: root.backend.trackTitle; font.pixelSize: 27; maximumLineCount: 4; elide: Text.ElideRight }
        PlayerText { Layout.fillWidth: true; text: root.backend.artist; font.pixelSize: 13; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
        Rectangle { Layout.fillWidth: true; Layout.topMargin: 4; implicitHeight: 1; color: root.lineColor }
        PlayerText { text: "ALBUM" }
        PlayerText { Layout.fillWidth: true; text: root.backend.album; color: "#a09b96"; maximumLineCount: 2; elide: Text.ElideRight }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.lineColor }
        PlayerSeek { Layout.fillWidth: true; backend: root.backend }
        PlayerTransport { Layout.fillWidth: true; backend: root.backend }
        RowLayout {
            Layout.fillWidth: true
            PlayerText { Layout.fillWidth: true; text: root.backend.sourceName; color: "#a09b96"; maximumLineCount: 1; elide: Text.ElideRight }
            PlayerButton { text: root.sourcesOpen ? "CLOSE" : "SOURCES"; onClicked: root.sourcesOpen = !root.sourcesOpen; Accessible.name: "Toggle connected players" }
        }
        PlayerSources { visible: root.sourcesOpen; Layout.fillWidth: true; backend: root.backend }
    }
}
