// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: overlay
    required property LockSession session
    property bool reactive: false
    property color paper: "#e4e2dc"
    property color ground: "#090909"
    property color muted: "#99958b"
    property color line: "#48433b"
    Rectangle {
        id: curtain
        width: parent.width
        height: parent.height
        y: overlay.session.previewing ? 0 : -height * 1.01
        color: "#d1161c"
        visible: y > -height
        Behavior on y { NumberAnimation { duration: overlay.session.animationEnabled ? 440 : 0; easing.type: Easing.BezierSpline; easing.bezierCurve: [.76, 0, .24, 1, 1, 1] } }
        Column {
            anchors.centerIn: parent
            spacing: overlay.reactive ? 18 : 20
            LockText {
                anchors.horizontalCenter: parent.horizontalCenter
                text: overlay.reactive ? "継衛 / TYPE 17" : "継衛"
                color: "#090909"
                font.family: "Noto Sans CJK JP"
                font.pixelSize: overlay.reactive ? 16 : 50
            }
            LockText { visible: overlay.reactive; text: "SID0NIA"; color: "#090909"; font.pixelSize: Math.max(26, Math.min(48, overlay.width * .05)); font.letterSpacing: 8 }
            LockText { anchors.horizontalCenter: parent.horizontalCenter; text: "UNLOCK PREVIEW"; color: "#090909"; font.letterSpacing: 2 }
        }
    }
    Rectangle {
        id: modal
        objectName: "powerDialog"
        anchors.fill: parent
        visible: overlay.session.powerAction !== ""
        color: "#df000000"
        onVisibleChanged: { if (visible) back.forceActiveFocus(Qt.OtherFocusReason); }
        MouseArea { anchors.fill: parent; onClicked: back.forceActiveFocus(Qt.OtherFocusReason) }
        Rectangle {
            anchors.centerIn: parent
            width: Math.min(overlay.reactive ? 380 : 340, parent.width - 40)
            height: overlay.reactive ? 237 : 205
            color: overlay.reactive ? "#101010" : "#111111"
            border.color: overlay.reactive ? overlay.line : "#d1161c"
            Accessible.role: Accessible.Dialog
            Accessible.name: question.text
            Column {
                anchors.fill: parent; anchors.margins: 28
                spacing: 20
                LockText { visible: overlay.reactive; text: "TSUGUMORI // POWER"; color: "#d1161c" }
                LockText {
                    id: question
                    text: overlay.session.powerAction === "restart" ? "Restart?" : "Shut down?"
                    color: "#e4e2dc"; font.pixelSize: overlay.reactive ? 26 : 22
                }
                LockText { width: parent.width; text: "Preview only. No system action will run."; color: "#99958b"; font.pixelSize: 12; wrapMode: Text.WordWrap }
                LockButton {
                    id: back
                    objectName: "closePowerDialog"
                    width: parent.width
                    filled: true
                    text: overlay.reactive ? "BACK TO LOCKSCREEN" : "BACK"
                    paper: "#e4e2dc"; ink: "#e4e2dc"
                    onClicked: overlay.session.closePower()
                    Keys.onEscapePressed: overlay.session.closePower()
                    Keys.onTabPressed: event => { event.accepted = true; back.forceActiveFocus(); }
                    Keys.onBacktabPressed: event => { event.accepted = true; back.forceActiveFocus(); }
                }
            }
        }
    }
}
