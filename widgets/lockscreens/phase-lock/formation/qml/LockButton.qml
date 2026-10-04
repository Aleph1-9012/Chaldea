// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Button {
    id: control

    implicitHeight: 32
    padding: 9
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus

    contentItem: LockText {
        text: control.text
        color: "#e4e2dc"
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }

    background: Rectangle {
        color: control.hovered ? "#24201d" : "#151515"
        border.color: control.visualFocus ? "#e4e2dc" : "#55504a"
        border.width: control.visualFocus ? 2 : 1
    }

}
