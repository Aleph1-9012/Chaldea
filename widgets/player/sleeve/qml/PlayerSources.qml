// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts

ColumnLayout {
    id: sources
    required property PlayerBackend backend
    spacing: 8
    RowLayout {
        Layout.fillWidth: true
        PlayerText { text: "CONNECTED PLAYERS"; color: "#a09b96"; Layout.fillWidth: true }
        PlayerText { text: String(sources.backend.players.length).padStart(2, "0"); color: "#a09b96" }
    }
    PlayerText {
        visible: sources.backend.players.length === 0
        Layout.fillWidth: true
        text: "Open a player that supports MPRIS. Its current track will appear here."
        color: "#a09b96"
    }
    ScrollView {
        id: scroll
        visible: sources.backend.players.length > 0
        Layout.fillWidth: true
        Layout.preferredHeight: Math.min(4, sources.backend.players.length) * 66
        contentWidth: availableWidth
        clip: true
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        Column {
            width: scroll.availableWidth
            Repeater {
                model: sources.backend.players
                delegate: PlayerButton {
                    id: entry
                    required property var modelData
                    required property int index
                    width: parent.width
                    height: 66
                    selected: sources.backend.player === modelData
                    text: modelData.identity || "Media player"
                    Accessible.name: text + ", " + (modelData.trackTitle || "Untitled track")
                    onClicked: sources.backend.selectPlayer(modelData.dbusName)
                    contentItem: RowLayout {
                        spacing: 8
                        PlayerText { text: String(entry.index + 1).padStart(2, "0") + " //"; color: entry.selected ? "#e8e8e8" : "#a09b96" }
                        ColumnLayout {
                            spacing: 4
                            Layout.fillWidth: true
                            PlayerText { text: entry.modelData.trackTitle || "Untitled track"; Layout.fillWidth: true; maximumLineCount: 1; elide: Text.ElideRight }
                            PlayerText { text: entry.text; Layout.fillWidth: true; maximumLineCount: 1; elide: Text.ElideRight; color: entry.selected ? "#e8e8e8" : "#a09b96" }
                        }
                        PlayerText { text: entry.modelData.isPlaying ? ">" : "II" }
                    }
                }
            }
        }
    }
}
