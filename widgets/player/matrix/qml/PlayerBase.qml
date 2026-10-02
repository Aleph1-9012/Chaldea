// SPDX-License-Identifier: 0BSD
import QtQuick

Rectangle {
    id: base
    property bool artworkEnabled: true
    property bool strongFrames: false
    property bool sourcesOpen: false
    readonly property PlayerBackend backend: media
    readonly property color lineColor: strongFrames ? "#716863" : "#34302f"
    color: "#0a0a0a"
    border.color: lineColor
    implicitWidth: 680
    PlayerBackend { id: media; monitoring: base.visible }
    Rectangle { z: 10; width: 7; height: 1; color: "#cc1515" }
    Rectangle { z: 10; width: 1; height: 7; color: "#cc1515" }
    Rectangle { z: 10; anchors.right: parent.right; anchors.bottom: parent.bottom; width: 7; height: 1; color: "#cc1515" }
    Rectangle { z: 10; anchors.right: parent.right; anchors.bottom: parent.bottom; width: 1; height: 7; color: "#cc1515" }
}
