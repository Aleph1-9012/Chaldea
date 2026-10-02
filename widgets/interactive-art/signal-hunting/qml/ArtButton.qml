// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
Button {
    id: control
    property color accent: "#cc1515"
    property bool selected: false
    implicitWidth: label.implicitWidth + 24
    implicitHeight: 38
    padding: 8
    font.family: "JetBrains Mono"
    font.pixelSize: 12
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    opacity: enabled ? 1 : .4
    Accessible.name: text
    background: Rectangle {
        color: control.selected || control.down || control.hovered ? control.accent : "#0a0a0a"
        border.color: control.visualFocus ? "#e8e8e8" : control.selected ? control.accent : "#492020"
        border.width: control.visualFocus ? 2 : 1
    }
    contentItem: ArtText {
        id: label
        text: control.text
        font: control.font
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        maximumLineCount: 2
        elide: Text.ElideRight
    }
}
