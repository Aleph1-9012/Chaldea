// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
Button {
    id: control
    property color ink: "#16151a"
    property color paper: "#f6f5f2"
    property color line: Qt.rgba(ink.r, ink.g, ink.b, .16)
    property bool selected: false
    implicitWidth: Math.ceil(measurement.width) + 28
    implicitHeight: 36
    padding: 8
    font.family: "JetBrains Mono"
    font.pixelSize: 12
    font.letterSpacing: 1.5
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    opacity: enabled ? 1 : .4
    Accessible.name: text
    readonly property bool filled: selected || down || hovered
    TextMetrics { id: measurement; text: control.text; font: control.font }
    background: Rectangle {
        color: control.filled ? control.ink : "transparent"
        border.color: control.visualFocus || control.filled ? control.ink : control.line
        border.width: control.visualFocus ? 2 : 1
    }
    contentItem: InkText {
        id: label
        text: control.text
        font: control.font
        color: control.filled ? control.paper : control.ink
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        maximumLineCount: 1
        elide: Text.ElideRight
    }
}
