// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: footer
    required property LockSession session
    property color paper: "#e4e2dc"
    property color muted: "#99958b"
    property color line: "#48433b"
    property bool reactive: false
    property bool printLayout: false
    readonly property bool stacked: reactive && width < 450
    implicitHeight: reactive ? stacked ? 86 : 46 : printLayout ? 49.4 : 53
    Rectangle { width: parent.width; height: 1; color: footer.line }
    Row {
        y: footer.reactive ? 17 : 22
        spacing: 14
        Rectangle {
            width: 80; height: 25; color: "#d1161c"
            LockText { anchors.centerIn: parent; text: "SID0NIA"; font.pixelSize: 12; font.letterSpacing: 2; color: "#090909" }
        }
        LockText { anchors.verticalCenter: parent.verticalCenter; text: "播種船 シドニア"; color: footer.muted; font.family: "Noto Sans CJK JP"; font.pixelSize: 12 }
    }
    Row {
        anchors.right: parent.right
        y: footer.stacked ? 54 : footer.reactive ? 13 : 17
        spacing: 22
        LockButton {
            objectName: "restartPreview"
            text: "RESTART"; paper: footer.paper; ink: footer.muted
            onClicked: footer.session.openPower("restart", this)
        }
        LockButton {
            objectName: "shutdownPreview"
            text: "SHUTDOWN"; paper: footer.paper; ink: footer.muted
            onClicked: footer.session.openPower("shutdown", this)
        }
    }
}
