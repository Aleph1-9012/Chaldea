// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

NotesBase {
    id: root
    property int indexWidth: 150
    defaultRowHeight: 58
    defaultRowGap: 0
    implicitWidth: 560
    implicitHeight: Math.max(root.noteListHeight + 46, editorColumn.implicitHeight + 18) + 98
    Rectangle { objectName: "notesSurface"; anchors.fill: parent; color: root.paper; border.color: root.accent }
    NoteGrid { anchors.fill: parent; line: Qt.rgba(root.accent.r, root.accent.g, root.accent.b, 0.06) }
    Item {
        id: header; x: 18; y: 10; width: root.width - 36; height: 34
        Text { anchors.verticalCenter: parent.verticalCenter; text: "QUICK NOTES"; textFormat: Text.PlainText; color: root.ink; font.family: root.monoFont; font.pixelSize: 13; font.letterSpacing: 2 }
        Text { visible: root.width > 440; x: 150; anchors.verticalCenter: parent.verticalCenter; text: "━ メモ"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
        NoteButton { ink: root.ink; paper: root.paper; accent: root.accent; line: root.rule; accentInk: root.accentInk; markerInk: root.accent; objectName: "addNote"; anchors.right: parent.right; text: "+ NEW"; onClicked: { root.noteStore.add(root.prependNewNotes); editor.focusTitle(); } }
    }
    Rectangle { y: 53; width: root.width; height: 1; color: root.rule }
    Item {
        id: indexPanel; x: 1; y: 54; width: Math.min(root.width * 0.34, root.indexWidth); height: root.height - 98
        Rectangle { anchors.right: parent.right; height: parent.height; width: 1; color: root.rule }
        Text { x: 12; y: 15; text: "INDEX / " + root.noteStore.serial(root.noteCount); textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
        NoteList { ink: root.ink; paper: root.paper; accent: root.accent; rule: root.rule; accentInk: root.accentInk; markerInk: root.accent; objectName: "noteList"; y: 46; width: parent.width - 1; maxHeight: root.noteListHeight; store: root.noteStore; rowHeight: root.noteRowHeight; spacing: root.noteRowGap; flat: true; flatHighlight: false; wrapLabels: true; numbered: root.numbered }
    }
    Column {
        id: editorColumn
        x: indexPanel.width + 16; y: 72; width: root.width - x - 18; spacing: 12
        Text { text: "NOTE " + root.noteStore.serial(root.selectedIndex + 1); textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
        Text { objectName: "textCount"; visible: root.counterMode !== "Off"; width: parent.width; text: editor.statistics; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
        NoteEditor { ink: root.ink; muted: root.muted; accent: root.accent; accentInk: root.accentInk; id: editor; width: parent.width; store: root.noteStore; titleSize: root.headingSize; bodyHeight: root.writingHeight; counterMode: root.counterMode; writingFont: root.sansFont; titleFont: root.monoFont; rule: root.rule }
    }
    Rectangle { anchors.bottom: parent.bottom; anchors.bottomMargin: 42; width: root.width; height: 1; color: root.rule }
    Text { x: 18; anchors.bottom: parent.bottom; anchors.bottomMargin: 14; text: "NOTES KEPT IN THIS SESSION ONLY"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
}
