// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Window
import QtQuick.Controls.Basic
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Glyph preview"
        width: 402
        height: glyph.implicitHeight + 48
        minimumWidth: 280
        minimumHeight: 240
        color: "#090909"
        ScrollView {
            id: viewport
            anchors.fill: parent
            anchors.margins: 24
            contentWidth: availableWidth
            clip: true
            ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
            Widget {
                id: glyph
                width: Math.min(354, viewport.availableWidth)
                x: Math.max(0, (viewport.availableWidth - width) / 2)
                Component.onCompleted: focusInput()
            }
        }
    }
}
