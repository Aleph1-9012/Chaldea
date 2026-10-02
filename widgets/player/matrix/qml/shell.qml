// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Window
import QtQuick.Controls.Basic
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Player"
        width: player.implicitWidth + 48
        height: Math.min(850, player.implicitHeight + 48)
        minimumWidth: 320
        minimumHeight: 200
        color: "#080808"
        ScrollView {
            id: viewport
            anchors.fill: parent
            anchors.margins: 24
            contentWidth: availableWidth
            clip: true
            ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
            Widget { id: player; width: viewport.availableWidth }
        }
    }
}
