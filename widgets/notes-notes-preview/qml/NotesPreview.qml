// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

NotesBase {
    id: root
    defaultRowGap: 3
    property int drawerWidth: 414
    property bool headerMarker: true
    property bool opened: true
    originalPaper: "#111111"
    originalRule: "#383838"
    implicitWidth: drawerWidth
    implicitHeight: layout.implicitHeight + 36
    Keys.onEscapePressed: event => { root.opened = false; close.forceActiveFocus(); event.accepted = true; }
    Component.onCompleted: root.noteStore.entries.setProperty(1, "body", "Check monitor names\nhyprctl monitors\n\nCheck audio outputs\nwpctl status")
    Rectangle { objectName: "notesSurface"; anchors.fill: parent; color: root.paper; border.color: root.rule }
    Column {
        id: layout; x: 20; y: 18; width: root.width - 40; spacing: root.opened ? 16 : 0
        Item {
            width: parent.width; height: 56
            Text { text: "QUICK NOTES"; textFormat: Text.PlainText; color: root.ink; font.family: root.monoFont; font.pixelSize: 15; font.letterSpacing: 2 }
            Text { y: 24; text: "TSUGUMORI / PERSONAL LOG"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 10 }
            Rectangle { objectName: "headerMarker"; y: 54; width: 34; height: 2; color: root.accent; visible: root.headerMarker }
            NoteButton { ink: root.ink; accentInk: root.accentInk; markerInk: root.accent; id: close; objectName: "closeNotes"; anchors.right: parent.right; width: 50; text: root.opened ? "×" : "OPEN"; Accessible.name: root.opened ? "Close notes" : "Open notes"; paper: root.paper; accent: root.customPalette ? root.accent : root.ink; line: root.rule; onClicked: root.opened = !root.opened }
        }
        Column {
            visible: root.opened; width: parent.width; spacing: 14
            NoteList { ink: root.ink; accentInk: root.accentInk; markerInk: root.accent; objectName: "noteList"; width: parent.width; store: root.noteStore; rowHeight: root.noteRowHeight; spacing: root.noteRowGap; maxHeight: root.noteListHeight; numbered: root.numbered; flat: true; accent: root.customPalette ? root.softFill : "#202020"; paper: root.paper; textSize: 13; rule: root.rule }
            Rectangle { width: parent.width; height: 1; color: root.rule }
            Text { text: "ENTRY " + root.noteStore.serial(root.selectedIndex + 1) + " / " + root.noteStore.serial(root.noteCount); textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            Text { objectName: "textCount"; visible: root.counterMode !== "Off"; width: parent.width; text: editor.statistics; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            NoteEditor { ink: root.ink; muted: root.muted; accent: root.accent; accentInk: root.accentInk; id: editor; width: parent.width; store: root.noteStore; writingFont: root.monoFont; bodyHeight: root.writingHeight; titleSize: root.headingSize; counterMode: root.counterMode; rule: root.rule }
            Rectangle { width: parent.width; height: 1; color: root.rule }
            Item {
                width: parent.width; height: 36
                NoteButton { ink: root.ink; accentInk: root.accentInk; markerInk: root.accent; objectName: "addNote"; text: "+ NEW NOTE"; paper: root.paper; accent: root.customPalette ? root.accent : root.ink; line: root.customPalette ? root.rule : "#595959"; onClicked: { root.noteStore.add(root.prependNewNotes); editor.focusTitle(); } }
                Text { anchors.right: parent.right; width: parent.width - 140; text: "SESSION ONLY\nNOT SAVED TO DISK"; textFormat: Text.PlainText; horizontalAlignment: Text.AlignRight; color: root.muted; font.family: root.monoFont; font.pixelSize: 10 }
            }
        }
    }
}
