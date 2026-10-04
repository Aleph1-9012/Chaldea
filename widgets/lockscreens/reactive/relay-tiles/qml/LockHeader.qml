// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: header
    property color paper: "#e4e2dc"
    property color muted: "#99958b"
    property bool reactive: false
    property bool compact: false
    implicitHeight: reactive ? 34 : compact ? 26.8 : 29.6
    Row {
        anchors.verticalCenter: parent.verticalCenter
        spacing: 16
        LockText { text: "TSUGUMORI"; color: header.paper; font.letterSpacing: 1.3 }
        LockText { text: "//"; color: "#d1161c"; font.pixelSize: header.reactive ? 14 : 11 }
        LockText { text: "TYPE-17"; color: header.muted; font.letterSpacing: 1.3 }
    }
    Rectangle {
        anchors.right: parent.right
        width: header.reactive ? 78 : 76
        height: parent.height
        color: "#d1161c"
        LockText { anchors.centerIn: parent; text: "◆ 704"; color: "#090909"; font.pixelSize: 14; font.letterSpacing: 2 }
    }
}
