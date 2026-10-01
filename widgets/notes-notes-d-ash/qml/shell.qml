// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Window
import QtQuick.Controls.Basic
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "XLR8 / Quick notes"
        width: Math.max(360, notes.implicitWidth + 48)
        height: Math.min(800, notes.implicitHeight + 48)
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
            Widget { id: notes; width: viewport.availableWidth }
        }
    }
}
