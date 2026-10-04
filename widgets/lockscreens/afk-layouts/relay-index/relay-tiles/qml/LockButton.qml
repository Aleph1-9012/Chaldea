// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Button {
    id: button
    property color paper: "#e4e2dc"
    property color ink: "#99958b"
    property color ground: "#090909"
    property bool filled: false
    property bool outlined: false
    property bool fullWidth: false
    property bool animationEnabled: true
    implicitWidth: Math.max(44, label.implicitWidth + (outlined ? 26 : 0))
    implicitHeight: outlined || filled ? 44 : 32
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    padding: outlined ? 13 : 0
    contentItem: LockText {
        id: label
        text: button.text
        font.letterSpacing: 1.1
        color: button.fullWidth ? button.paper : button.filled || button.outlined && (button.hovered || button.visualFocus) ? "#090909" : button.hovered || button.visualFocus ? button.paper : button.ink
        verticalAlignment: Text.AlignVCenter
        horizontalAlignment: button.fullWidth ? Text.AlignLeft : Text.AlignHCenter
    }
    background: Rectangle {
        color: button.filled ? button.hovered ? "#eb2027" : "#d1161c" : "transparent"
        clip: button.fullWidth
        Rectangle {
            visible: button.outlined
            width: parent.width; height: parent.height
            x: button.hovered || button.visualFocus ? 0 : -width - 1
            color: "#d1161c"
            Behavior on x { NumberAnimation { duration: button.animationEnabled ? 280 : 0; easing.type: Easing.BezierSpline; easing.bezierCurve: [.76, 0, .24, 1, 1, 1] } }
        }
        border.width: button.outlined ? 1 : 0
        border.color: "#d1161c"
        Rectangle {
            anchors.fill: parent
            anchors.margins: -3
            color: "transparent"
            border.color: button.paper
            visible: button.visualFocus
        }
    }
}
