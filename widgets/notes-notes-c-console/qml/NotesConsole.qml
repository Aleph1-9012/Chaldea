// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

NotesBase {
    id: root
    defaultRowGap: 3
    property bool comfortable: false
    property bool redHeading: false
    property bool listExpanded: false
    readonly property int inset: comfortable ? 18 : 12
    implicitWidth: 460
    implicitHeight: layout.implicitHeight + 2 * inset + 56
    Keys.onEscapePressed: event => { root.listExpanded = false; toggle.forceActiveFocus(); event.accepted = true; }
    Rectangle { width: root.width; height: 28; color: root.paper; visible: root.customPalette }
    Rectangle { y: root.height - 28; width: root.width; height: 28; color: root.paper; visible: root.customPalette }
    Rectangle { objectName: "notesSurface"; y: 28; width: root.width; height: root.height - 56; color: root.paper; border.color: root.customPalette ? root.rule : "#562020" }
    Rectangle { width: root.width; height: 1; color: root.customPalette ? root.rule : "#743030" }
    Text { x: 9; y: 6; text: "TSUGUMORI // PERSONAL LOG"; textFormat: Text.PlainText; color: root.customPalette ? root.muted : "#ba9b9b"; font.family: root.monoFont; font.pixelSize: 11 }
    Text { anchors.right: parent.right; anchors.rightMargin: 9; y: 6; text: "C"; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
    Column {
        id: layout; x: root.inset; y: 28 + root.inset; width: root.width - 2 * root.inset; spacing: 10
        Item {
            width: parent.width; height: 26
            Text { text: "▪ QUICK NOTES"; textFormat: Text.PlainText; color: root.customPalette ? root.muted : "#b5a3a3"; font.family: root.monoFont; font.pixelSize: 11 }
            Text { anchors.right: parent.right; text: "NOTE " + root.noteStore.serial(root.selectedIndex + 1) + " / " + root.noteStore.serial(root.noteCount); textFormat: Text.PlainText; color: root.customPalette ? root.muted : "#b5a3a3"; font.family: root.monoFont; font.pixelSize: 11 }
            Rectangle { anchors.bottom: parent.bottom; width: parent.width; height: 1; color: root.customPalette ? root.rule : "#431c1c" }
        }
        Text { objectName: "textCount"; visible: root.counterMode !== "Off"; width: parent.width; text: editor.statistics; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
        Item {
            width: parent.width; height: editor.height
            Text { text: "//"; color: root.accent; font.family: root.monoFont; font.pixelSize: 24; y: 4 }
            NoteEditor { accent: root.accent; ink: root.ink; muted: root.muted; accentInk: root.accentInk; id: editor; width: parent.width; titleIndent: 36; store: root.noteStore; writingFont: root.monoFont; titleSize: root.headingSize; counterMode: root.counterMode; titleRule: false; titleInk: root.redHeading ? root.accent : root.ink; bodyHeight: root.writingHeight; rule: root.rule }
        }
        Rectangle { width: parent.width; height: 1; color: root.customPalette ? root.rule : "#431c1c" }
        Row {
            width: parent.width; spacing: 8
            NoteButton { ink: root.ink; paper: root.paper; accent: root.accent; line: root.rule; accentInk: root.accentInk; markerInk: root.accent; id: toggle; objectName: "toggleNotes"; width: parent.width - 90; text: (root.listExpanded ? "↑ NOTES · " : "↓ NOTES · ") + root.noteStore.serial(root.noteCount); onClicked: root.listExpanded = !root.listExpanded }
            NoteButton { ink: root.ink; paper: root.paper; accent: root.accent; line: root.rule; accentInk: root.accentInk; markerInk: root.accent; objectName: "addNote"; width: 82; text: "+ NEW"; onClicked: { root.noteStore.add(root.prependNewNotes); root.listExpanded = false; editor.focusTitle(); } }
        }
        NoteList { ink: root.ink; paper: root.paper; accent: root.accent; rule: root.rule; accentInk: root.accentInk; markerInk: root.accent; objectName: "noteList"; width: parent.width; store: root.noteStore; rowHeight: root.noteRowHeight; spacing: root.noteRowGap; maxHeight: root.noteListHeight; numbered: root.numbered; visible: root.listExpanded; onActivated: { root.listExpanded = false; toggle.forceActiveFocus(); } }
    }
    Rectangle { anchors.bottom: parent.bottom; anchors.bottomMargin: 24; width: root.width; height: 1; color: root.customPalette ? root.rule : "#743030" }
    Text { x: 9; anchors.bottom: parent.bottom; anchors.bottomMargin: 5; text: "TSUGUMORI NOTES / SESSION ONLY"; textFormat: Text.PlainText; color: root.customPalette ? root.muted : "#ba9b9b"; font.family: root.monoFont; font.pixelSize: 11 }
}
