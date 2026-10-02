// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic

ListView {
    id: list
    required property NoteStore store
    property bool numbered: true
    property bool uppercase: false
    property bool allowDelete: false
    property bool flat: false
    property bool markers: false
    property real letterSpacing: 0
    property bool flatHighlight: true
    property int rowHeight: 40
    property int maxHeight: 164
    property int textSize: 12
    property string writingFont: "Share Tech Mono"
    property color ink: "#e8e8e8"
    property color paper: "#0a0a0a"
    property color accent: "#cc1515"
    property color rule: "#663030"
    property color accentInk: paper
    property color markerInk: accent
    property bool wrapLabels: false
    signal removed()
    signal activated(int index)
    implicitHeight: Math.min(store.count * rowHeight + Math.max(0, store.count - 1) * spacing, maxHeight)
    clip: true
    spacing: flat ? 3 : 7
    boundsBehavior: Flickable.StopAtBounds
    currentIndex: store.selected
    model: store.entries
    ScrollBar.vertical: ScrollBar { }
    function revealSelection(): void {
        forceLayout();
        if (store.selected >= 0) positionViewAtIndex(store.selected, ListView.Contain);
    }
    onRowHeightChanged: Qt.callLater(revealSelection)
    onSpacingChanged: Qt.callLater(revealSelection)
    onHeightChanged: Qt.callLater(revealSelection)
    Connections {
        target: list.store
        function onSelectionChanged(): void { Qt.callLater(list.revealSelection); }
    }
    delegate: Row {
        id: row
        required property int index
        required property string title
        width: list.width
        height: list.rowHeight
        NoteButton { accentInk: list.accentInk; markerInk: list.markerInk;
            objectName: "selectNote-" + row.index
            width: row.width - (list.allowDelete ? 34 : 0)
            height: row.height
            text: (list.numbered ? list.store.serial(row.index + 1) + " // " : "") + ((row.title.trim() || "Untitled note")[list.uppercase ? "toUpperCase" : "toString"]())
            selected: row.index === list.store.selected
            leftAligned: true
            framed: !list.flat
            flat: list.flat && list.flatHighlight
            marker: list.markers
            wrapLabel: list.wrapLabels
            inset: list.markers ? 24 : 10
            font.family: list.writingFont
            font.pixelSize: list.textSize
            font.letterSpacing: list.letterSpacing
            ink: list.ink; paper: list.paper; accent: list.accent; line: list.rule
            onClicked: { list.store.select(row.index); list.activated(row.index); }
        }
        NoteButton { accentInk: list.accentInk; markerInk: list.markerInk;
            objectName: "deleteNote-" + row.index
            visible: list.allowDelete
            width: 34; height: row.height
            text: "×"
            font.pixelSize: 20
            Accessible.name: "Delete " + (row.title.trim() || "Untitled note")
            selected: row.index === list.store.selected
            ink: list.ink; paper: list.paper; accent: list.accent; line: list.rule
            onClicked: { list.store.remove(row.index); list.removed(); }
        }
    }
}
