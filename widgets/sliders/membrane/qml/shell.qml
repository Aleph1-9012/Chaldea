// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Window
import Quickshell

ShellRoot {
    Window {
        visible: true
        title: "Chaldea / Membrane"
        width: slider.implicitWidth + 48
        height: slider.implicitHeight + 48
        minimumWidth: 288
        minimumHeight: slider.implicitHeight + 48
        color: "#080808"
        Widget { id: slider; anchors.centerIn: parent; width: parent.width - 48 }
    }
}
