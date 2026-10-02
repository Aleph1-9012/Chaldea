// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

NotesBase {
    id: root
    property bool opened: true
    property bool doubleFrame: true
    property bool allowDelete: false
    property bool redPalette: false
    property int writingSize: 16
    property string writingFont: sansFont
    property int gridStrength: 0
    readonly property color highlight: customPalette || redPalette ? accent : ink
    originalRule: redPalette ? "#703030" : "#808080"
    originalPaper: redPalette ? "#0a0a0a" : "#111111"
    implicitWidth: 420
    implicitHeight: layout.implicitHeight + 40
    Keys.onEscapePressed: event => { root.opened = false; close.forceActiveFocus(); event.accepted = true; }
    Rectangle { objectName: "notesSurface"; anchors.fill: parent; color: root.paper; border.color: root.highlight }
    NoteGrid { anchors.fill: parent; visible: root.gridStrength > 0; line: Qt.rgba(root.accent.r, root.accent.g, root.accent.b, root.gridStrength / 100) }
    Rectangle { objectName: "innerFrame"; anchors.fill: parent; anchors.margins: 4; visible: root.doubleFrame; color: "transparent"; border.color: root.rule; opacity: 0.65 }
    Rectangle { x: 0; y: 16; width: 4; height: 40; color: root.accent }
    Repeater {
        model: 4
        Item {

            required property int index
            x: index % 2 ? root.width - 8 : 6
            y: index < 2 ? -1 : root.height - 7
            width: 8; height: 8
            Rectangle { width: 8; height: 2; y: parent.index < 2 ? 0 : 6; color: root.ink }
            Rectangle { width: 2; height: 8; x: parent.index % 2 ? 6 : 0; color: root.ink }
        }
    }
    Column {
        id: layout
        x: 20; y: 20; width: root.width - 40; spacing: root.opened ? 16 : 0
        Item {
            width: parent.width; height: 34
            Text { text: "QUICK NOTES"; textFormat: Text.PlainText; color: root.ink; font.family: root.allowDelete ? root.monoFont : root.sansFont; font.pixelSize: root.allowDelete ? 14 : 12; font.letterSpacing: 3; anchors.verticalCenter: parent.verticalCenter }
            Rectangle { y: 33; width: 36; height: 1; color: root.rule }
            NoteButton { accentInk: root.accentInk; markerInk: root.accent;
                id: close; objectName: "closeNotes"
                anchors.right: parent.right; width: 54; height: 32
                text: root.opened ? "ESC" : "OPEN"
                Accessible.name: root.opened ? "Close notes" : "Open notes"
                ink: root.ink; paper: root.paper; accent: root.highlight; line: root.rule
                onClicked: root.opened = !root.opened
            }
        }
        Column {
            width: parent.width; spacing: 14; visible: root.opened
            NoteList { accentInk: root.accentInk; markerInk: root.accent;
                objectName: "noteList"
                onRemoved: Qt.callLater(function() { undo.forceActiveFocus(); })
                width: parent.width; store: root.noteStore
                numbered: root.numbered; uppercase: !root.allowDelete
                markers: true; letterSpacing: root.allowDelete ? 0.2 : 1.6
                allowDelete: root.allowDelete
                rowHeight: root.noteRowHeight; spacing: root.noteRowGap
                maxHeight: root.noteListHeight
                textSize: root.allowDelete ? 16 : 11
                writingFont: root.writingFont
                ink: root.ink; paper: root.paper; accent: root.highlight; rule: root.rule
            }
            Item {
                width: parent.width; height: 16; visible: root.noteCount > 0
                Text { objectName: "textCount"; visible: root.counterMode !== "Off" || !root.allowDelete; width: parent.width - 85; text: root.counterMode === "Off" ? "PERSONAL / SESSION" : editor.statistics; textFormat: Text.PlainText; elide: Text.ElideRight; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
                Text { anchors.right: parent.right; text: root.noteStore.serial(root.selectedIndex + 1) + " / " + root.noteStore.serial(root.noteCount); textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            }
            NoteEditor { accentInk: root.accentInk;
                id: editor; width: parent.width; visible: root.noteCount > 0
                store: root.noteStore; writingFont: root.writingFont
                bodySize: root.writingSize; bodyHeight: root.writingHeight; titleSize: root.headingSize
                counterMode: root.counterMode
                ink: root.ink; muted: root.muted; rule: root.rule; accent: root.highlight
            }
            Text { objectName: "emptyNotes"; visible: root.noteCount === 0; width: parent.width; height: 174; text: "No notes yet"; textFormat: Text.PlainText; horizontalAlignment: Text.AlignHCenter; verticalAlignment: Text.AlignVCenter; color: root.muted; font.family: root.writingFont; font.pixelSize: 16 }
            Item {
                width: parent.width; height: 50
                Rectangle { width: parent.width; height: 1; color: root.rule; opacity: 0.6 }
                NoteButton { accentInk: root.accentInk; markerInk: root.accent; objectName: "addNote"; y: 14; text: "+ NEW NOTE"; ink: root.ink; paper: root.paper; accent: root.highlight; line: root.rule; onClicked: { root.noteStore.add(root.prependNewNotes); editor.focusTitle(); } }
                Text { anchors.right: parent.right; y: 20; width: parent.width - 138; text: root.noteStore.status; textFormat: Text.PlainText; horizontalAlignment: Text.AlignRight; wrapMode: Text.Wrap; color: root.muted; font.family: root.monoFont; font.pixelSize: 10 }
            }
            Item {
                visible: root.allowDelete && root.noteStore.deleted.length > 0
                width: parent.width; height: 46
                Rectangle { width: parent.width; height: 1; color: root.rule }
                Text {
                    y: 16; width: parent.width - 70
                    text: root.noteStore.deleted.length ? "Deleted " + (root.noteStore.deleted[root.noteStore.deleted.length - 1].note.title || "Untitled note") : ""
                    textFormat: Text.PlainText; elide: Text.ElideRight; color: root.ink; font.family: root.writingFont; font.pixelSize: 12
                }
                NoteButton { ink: root.ink; paper: root.paper; accent: root.accent; line: root.rule; accentInk: root.accentInk; markerInk: root.accent; id: undo; objectName: "undoDelete"; anchors.right: parent.right; y: 10; text: "UNDO"; onClicked: { root.noteStore.undo(); editor.focusTitle(); } }
            }
        }
    }
}
