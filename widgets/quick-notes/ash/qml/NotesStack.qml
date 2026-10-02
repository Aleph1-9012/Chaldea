// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic

NotesBase {
    id: root
    defaultRowHeight: 110
    defaultRowGap: 10
    property bool showGrid: true
    readonly property int expandedExtra: writingHeight + headingSize + 20 + (counterMode === "Off" ? 0 : 25)
    readonly property int stackContentHeight: noteCount * noteRowHeight + Math.max(0, noteCount - 1) * noteRowGap + (selectedIndex >= 0 ? expandedExtra : 0)
    originalInk: "#2e2a1f"
    originalMuted: "#514a37"
    originalPaper: "#c8c8c4"
    implicitWidth: 410
    implicitHeight: Math.min(stackContentHeight, noteListHeight + expandedExtra) + 106
    Rectangle { objectName: "notesSurface"; width: root.width; height: 54; color: root.paper; border.color: root.accent }
    Rectangle { width: 3; height: 54; color: root.accent }
    Text { x: 14; y: 20; text: "QUICK NOTES"; textFormat: Text.PlainText; font.family: root.monoFont; font.pixelSize: 13; font.letterSpacing: 2; color: root.accent }
    NoteButton { accent: root.accent; accentInk: root.accentInk; markerInk: root.accent; objectName: "addNote"; anchors.right: parent.right; anchors.rightMargin: 14; y: 10; text: "+ NEW"; paper: root.paper; ink: root.accent; line: root.accent; onClicked: { root.noteStore.add(root.prependNewNotes); stack.revealSelection(); Qt.callLater(root.focusEditor); } }
    signal focusNewNote()
    function focusEditor(): void { focusNewNote(); }
    ListView {
        id: stack; objectName: "noteList"
        y: 64; width: root.width; height: root.height - 106
        model: root.noteStore.entries; currentIndex: root.selectedIndex
        clip: true; spacing: root.noteRowGap; boundsBehavior: Flickable.StopAtBounds
        ScrollBar.vertical: ScrollBar { }
        function revealSelection(): void {
            forceLayout();
            if (root.selectedIndex < 0) return;
            positionViewAtIndex(root.selectedIndex, ListView.Contain);
            forceLayout();
            // The expanded card is taller than the list's estimated row size.
            // Use its actual bounds without reacting to ordinary user scrolling.
            if (!currentItem) return;
            if (currentItem.y < contentY) contentY = currentItem.y;
            else if (currentItem.y + currentItem.height > contentY + height)
                contentY = currentItem.y + currentItem.height - height;
        }
        onHeightChanged: Qt.callLater(revealSelection)
        onSpacingChanged: Qt.callLater(revealSelection)
        Connections {
            target: root.noteStore
            function onSelectionChanged(): void { Qt.callLater(stack.revealSelection); }
        }
        delegate: Rectangle {
            id: memo
            required property int index
            required property int uid
            required property string title
            required property string body
            required property bool edited
            readonly property bool expanded: root.selectedIndex === index
            width: stack.width
            height: root.noteRowHeight + (expanded ? root.expandedExtra : 0)
            color: root.paper; border.color: root.accent
            Connections { target: root; function onFocusNewNote(): void { if (memo.expanded) editor.focusTitle(); } }
            NoteGrid { anchors.fill: parent; visible: root.showGrid; gridSize: 16; line: Qt.rgba(root.ink.r, root.ink.g, root.ink.b, 0.045) }
            Rectangle { width: 3; height: parent.height; color: root.accent }
            NoteButton { line: root.rule; accentInk: root.accentInk; markerInk: root.accent;
                objectName: "selectNote-" + memo.index
                x: 14; y: 4; width: parent.width - 28; height: 38
                text: (root.numbered ? root.noteStore.serial(memo.uid) + "   " : "") + "PERSONAL NOTE"
                Accessible.name: (memo.expanded ? "Collapse " : "Open ") + (memo.title || "Untitled note")
                leftAligned: true; framed: false; flat: true; inset: 0; font.pixelSize: 11
                ink: root.muted; paper: root.paper; accent: root.paper
                onClicked: root.noteStore.select(memo.expanded ? -1 : memo.index)
            }
            Text { anchors.right: parent.right; anchors.rightMargin: 16; y: 12; text: memo.expanded ? "−" : "+"; color: root.accent; font.pixelSize: 18 }
            Rectangle { x: 14; y: 42; width: parent.width - 28; height: 1; color: root.accent; opacity: 0.2 }
            Text { objectName: "textCount"; visible: memo.expanded && root.counterMode !== "Off"; x: 14; y: 50; width: parent.width - 28; text: editor.statistics; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            NoteEditor { accent: root.accent; accentInk: root.accentInk;
                id: editor; visible: memo.expanded; enabled: visible
                x: 14; y: root.counterMode === "Off" ? 50 : 75; width: parent.width - 28
                store: root.noteStore; noteIndex: memo.index
                ink: root.ink; muted: root.muted; titleInk: root.ink; rule: root.customPalette ? root.rule : "#9e8e82"
                bodyHeight: root.writingHeight; titleSize: root.headingSize; counterMode: root.counterMode; titleRule: false; writingFont: root.sansFont
            }
            Text { visible: memo.expanded; x: 14; y: memo.height - 26; text: memo.edited ? "EDITED IN SESSION" : "EDIT NOTE"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            Text { visible: memo.expanded; anchors.right: parent.right; anchors.rightMargin: 14; y: memo.height - 26; text: (memo.body ? memo.body.split("\n").length : 0) + " LINES"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
            NoteButton { line: root.rule; accentInk: root.accentInk; markerInk: root.accent;
                objectName: "summaryNote-" + memo.index
                visible: !memo.expanded; x: 14; y: 50; width: parent.width - 28; height: 52
                text: (memo.title || "Untitled note") + "\n" + (memo.body.split("\n")[0] || "Empty note")
                ink: root.ink; paper: root.paper; accent: root.paper; framed: false; flat: true; leftAligned: true; inset: 0; font.family: root.sansFont; font.pixelSize: 14; wrapLabel: true
                onClicked: root.noteStore.select(memo.index)
            }
        }
    }
    Rectangle { anchors.bottom: parent.bottom; width: root.width; height: 32; color: root.paper }
    Text { x: 10; anchors.bottom: parent.bottom; anchors.bottomMargin: 9; text: "SESSION ONLY · NOT SAVED TO DISK"; textFormat: Text.PlainText; color: root.muted; font.family: root.monoFont; font.pixelSize: 11 }
}
