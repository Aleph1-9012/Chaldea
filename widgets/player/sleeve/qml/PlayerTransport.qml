// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Layouts

GridLayout {
    id: transport
    required property PlayerBackend backend
    property bool vertical: false
    columns: vertical ? 1 : 3
    rowSpacing: 7
    columnSpacing: 6
    PlayerButton {
        text: "PREV"
        Accessible.name: "Previous track"
        enabled: transport.backend.canPrevious
        Layout.fillWidth: true
        onClicked: transport.backend.previous()
    }
    PlayerButton {
        text: transport.backend.playing ? "PAUSE" : "PLAY"
        Accessible.name: transport.backend.playing ? "Pause" : "Play"
        enabled: transport.backend.canPlay
        selected: transport.backend.playing
        primary: true
        Layout.fillWidth: true
        implicitHeight: transport.vertical ? 67 : 42
        onClicked: transport.backend.togglePlaying()
    }
    PlayerButton {
        text: "NEXT"
        Accessible.name: "Next track"
        enabled: transport.backend.canNext
        Layout.fillWidth: true
        onClicked: transport.backend.next()
    }
}
