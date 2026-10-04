// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Window
import QtQuick.Controls.Basic
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Reactive / Relay tiles · visual lockscreen demo"
        width: 1000
        height: 840
        minimumWidth: 320
        minimumHeight: 320
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
