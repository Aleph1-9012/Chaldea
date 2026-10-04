// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Window
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Phase lock preview"
        width: 1024
        height: 724
        minimumWidth: 320
        minimumHeight: 300
        color: "#080808"

        ScrollView {
            id: viewport

            anchors.fill: parent
            contentWidth: availableWidth
            clip: true
            ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

            Widget {
                width: viewport.availableWidth
                height: Math.max(implicitHeight, viewport.availableHeight)
                Component.onCompleted: focusInput()
            }

        }

    }

}
