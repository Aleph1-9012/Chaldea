// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Button {
    id: control
    property bool selected: false
    property bool primary: false
    implicitHeight: 42
    implicitWidth: Math.max(50, label.implicitWidth + 20)
    padding: 6
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    Accessible.name: text
    opacity: enabled ? 1 : 0.4
    background: Rectangle {
        color: control.selected || control.down || control.hovered ? "#cc1515" : "#0a0a0a"
        border.width: control.visualFocus ? 2 : 1
        border.color: control.visualFocus ? "#e8e8e8" : control.primary ? "#cc1515" : "#4a403c"
    }
    contentItem: PlayerText {
        id: label
        text: control.text
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        wrapMode: Text.NoWrap
        elide: Text.ElideRight
    }
}
