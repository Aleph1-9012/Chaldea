// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Button {
    id: control
    property bool animationEnabled: true
    property bool solid: false
    property bool arrow: false
    property bool textOnly: false
    property color foreground: "#e4e2dc"
    implicitHeight: textOnly ? 32 : 44
    implicitWidth: textOnly ? label.implicitWidth : Math.max(44, label.implicitWidth + (arrow ? 28 : 0) + 24)
    padding: textOnly ? 0 : 12
    horizontalPadding: padding
    verticalPadding: padding
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    background: Rectangle {
        color: control.textOnly ? "transparent" : control.solid ? "#d1161c" : "#0b0b0b"
        border.width: control.textOnly ? 0 : 1
        border.color: "#d1161c"
        clip: true
        Rectangle {
            visible: !control.textOnly && !control.solid
            width: parent.width
            height: parent.height
            x: control.hovered || control.visualFocus ? 0 : -width - 1
            color: "#d1161c"
            Behavior on x { NumberAnimation { duration: control.animationEnabled ? 280 : 0; easing.type: Easing.InOutCubic } }
        }
        Rectangle { anchors.fill: parent; visible: control.visualFocus; color: "transparent"; border.color: "#e4e2dc"; border.width: 2 }
        Rectangle { visible: control.textOnly && control.hovered; width: parent.width; height: 1; anchors.bottom: parent.bottom; color: "#d1161c" }
    }
    contentItem: Item {
        LockText {
            id: label
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            width: Math.max(0, parent.width - (control.arrow ? 22 : 0))
            text: control.text
            color: control.hovered && control.solid ? "#ffffff" : control.foreground
            font.letterSpacing: control.textOnly ? 1 : .7
            wrapMode: Text.NoWrap
            elide: Text.ElideRight
        }
        Canvas {
            visible: control.arrow
            width: 16; height: 16
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            onPaint: {
                const ctx = getContext("2d");
                ctx.reset();
                ctx.scale(16 / 24, 16 / 24);
                ctx.strokeStyle = control.foreground;
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(5, 19); ctx.lineTo(19, 5);
                ctx.moveTo(5, 5); ctx.lineTo(19, 5); ctx.lineTo(19, 19); ctx.stroke();
            }
        }
    }
}
