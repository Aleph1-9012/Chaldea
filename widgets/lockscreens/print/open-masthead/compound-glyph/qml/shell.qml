// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Window
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Open masthead preview"
        width: 960
        height: 800
        minimumWidth: 320
        minimumHeight: 300
        color: "#090909"

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
