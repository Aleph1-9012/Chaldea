// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Window
import QtQuick.Controls.Basic
import Quickshell
ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Interactive art"
        width: 788
        height: Math.min(900, artwork.implicitHeight + 48)
        minimumWidth: 320; minimumHeight: 260
        color: "#080808"
        ScrollView {
            id: viewport
            anchors.fill: parent; anchors.margins: 24
            contentWidth: availableWidth
            clip: true
            ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
            Widget { id: artwork; width: viewport.availableWidth }
        }
    }
}
