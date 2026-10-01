// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic

Button {
    id: control
    property color ink: "#e8e8e8"
    property color paper: "#0a0a0a"
    property color accent: "#cc1515"
    property color line: "#663030"
    property color accentInk: paper
    property color markerInk: accent
    property bool selected: false
    property bool leftAligned: false
    property bool framed: true
    property bool marker: false
    property bool wrapLabel: false
    property int inset: 10
    implicitWidth: Math.max(34, label.implicitWidth + 2 * inset)
    implicitHeight: Math.max(34, label.implicitHeight + 16)
    padding: 0
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus
    font.family: "Share Tech Mono"
    font.pixelSize: 12
    Accessible.name: text
    background: Rectangle {

        color: control.selected || control.down || control.hovered ? control.accent : control.paper
        border.width: control.visualFocus ? 2 : control.framed ? 1 : 0
        border.color: control.visualFocus ? control.ink : control.line
        Rectangle { visible: control.marker && control.selected; x: 10; anchors.verticalCenter: parent.verticalCenter; width: 6; height: 6; rotation: 45; color: control.accentInk }
        Behavior on color { ColorAnimation { duration: 120 } }
        Rectangle { visible: control.flat && control.selected; width: 2; height: parent.height; color: control.markerInk }
    }
    contentItem: Text {
        id: label
        leftPadding: control.inset
        rightPadding: control.inset
        text: control.text
        textFormat: Text.PlainText
        font: control.font
        color: (control.selected || control.down || control.hovered) && !control.flat ? control.accentInk : control.ink
        horizontalAlignment: control.leftAligned ? Text.AlignLeft : Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        wrapMode: control.wrapLabel ? Text.Wrap : Text.NoWrap
        maximumLineCount: control.wrapLabel ? 2 : 1
        elide: control.wrapLabel ? Text.ElideNone : Text.ElideRight
    }
}
