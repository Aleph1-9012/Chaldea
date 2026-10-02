// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtTest

Item {
    id: testRoot
    width: 800; height: 1200
    Component { id: notesComponent; Widget { } }
    TestCase {
        id: suite
        name: "QuickNotesBehavior"
        when: windowShown
        property var widget
        function init() { widget = createTemporaryObject(notesComponent, testRoot); verify(widget !== null); waitForRendering(widget); }
        function visibleChild(item, name) {
            if (item.objectName === name && item.visible) return item;
            for (let i = 0; i < item.children.length; i++) {
                const child = visibleChild(item.children[i], name);
                if (child) return child;
            }
            return null;
        }
        function select(index) {
            const toggle = findChild(widget, "toggleNotes");
            if (toggle && !widget.listExpanded) { mouseClick(toggle); waitForRendering(widget); }
            const button = visibleChild(widget, "selectNote-" + index);
            verify(button !== null);
            mouseClick(button);
        }
        function test_palette_preserves_editor() {
            const title = visibleChild(widget, "noteTitle");
            mouseClick(title); keyClick(Qt.Key_A, Qt.ControlModifier); keyClick(Qt.Key_Q);
            const paletteKey = "s2Palette" in widget ? "s2Palette" : "palette";
            const surface = findChild(widget, "notesSurface");
            const add = findChild(widget, "addNote");
            verify(surface !== null);
            widget[paletteKey] = "Cobalt";
            compare(String(surface.color), "#101827");
            compare(String(widget.accentInk), "#0a0a0a");
            compare(String(visibleChild(widget, "noteBody").color), "#e5edfa");
            widget[paletteKey] = "Forest";
            compare(String(surface.color), "#121e19");
            widget[paletteKey] = "Paper";
            compare(String(surface.color), "#f4ecdd");
            compare(String(widget.accentInk), "#f5f5f0");
            compare(String(visibleChild(widget, "noteBody").selectedTextColor), "#f5f5f0");
            const selected = visibleChild(widget, "selectNote-0");
            if (selected && selected.selected && !selected.flat) compare(String(selected.contentItem.color), "#f5f5f0");
            compare(String(visibleChild(widget, "noteBody").color), "#2d2923");
            widget.backgroundColor = "#172132";
            widget.textColor = "#e2e8f0";
            widget.accentColor = "#79b8ef";
            widget[paletteKey] = "Custom";


            compare(String(surface.color), "#172132");
            compare(String(visibleChild(widget, "noteBody").color), "#e2e8f0");
            compare(String(add.accent), "#79b8ef");
            compare(String(visibleChild(widget, "noteBody").selectionColor), "#79b8ef");
            compare(surface.radius, 0);
            compare(surface.border.width, 1);
            compare(add.background.radius, 0);
            compare(add.background.border.width, 1);
            compare(widget.snapshot()[0].title, "q");
            verify(title.activeFocus);

            keyClick(Qt.Key_W);
            compare(widget.snapshot()[0].title, "qw");
            widget.width = 300;
            waitForRendering(widget);
            verify(title.width > 80);
        }
        function test_reading_options_preserve_editor_and_undo() {
            const body = visibleChild(widget, "noteBody");
            const literal = "one two\n継衛🙂";
            body.text = literal;
            body.forceActiveFocus(); body.cursorPosition = 3;
            widget.editorHeight = 280;
            widget.titleSize = 24;
            widget.listDensity = "Compact";
            widget.showNumbers = false;
            widget.textCount = "Words";
            compare(findChild(widget, "writingArea").height, 280);
            compare(visibleChild(widget, "noteTitle").font.pixelSize, 24);
            compare(findChild(widget, "noteList").rowHeight, 32);
            compare(visibleChild(widget, "textCount").text, "3 words");
            compare(visibleChild(widget, "selectNote-0").text, "Before I leave");
            compare(widget.snapshot()[0].body, literal);
            compare(body.cursorPosition, 3); verify(body.activeFocus);
            widget.textCount = "Characters";
            compare(visibleChild(widget, "textCount").text, "11 characters");
            select(1); select(0);
            compare(body.text, literal);
            mouseClick(findChild(widget, "deleteNote-0")); waitForRendering(widget);
            widget.listDensity = "Spacious";
            mouseClick(findChild(widget, "undoDelete")); waitForRendering(widget);
            compare(widget.snapshot()[0].body, literal);
            compare(visibleChild(widget, "textCount").text, "11 characters");
            compare(findChild(widget, "noteList").rowHeight, 48);
            widget.textCount = "Off";
            verify(visibleChild(widget, "textCount") === null);
        }
        function test_density_keeps_active_note_visible() {
            for (let i = 0; i < 12; i++) widget.noteStore.add(false);
            const list = findChild(widget, "noteList");
            for (const density of ["Compact", "Spacious", "Comfortable"]) {
                widget.listDensity = density;
                waitForRendering(widget);
                verify(list.contentHeight > list.height);
                tryVerify(function() {
                    const row = findChild(widget, "selectNote-13");
                    if (!row) return false;
                    const point = row.mapToItem(list, 0, 0);
                    return point.y >= -1 && point.y + row.height <= list.height + 1;
                });
            }
        }
        function test_new_note_placement_and_undo() {
            const body = visibleChild(widget, "noteBody");
            body.text = "Keep my current note";
            body.forceActiveFocus(); body.cursorPosition = 4;
            widget.newNotePosition = "Top";
            compare(widget.selectedIndex, 0);
            compare(widget.snapshot()[0].title, "Before I leave");
            compare(body.text, "Keep my current note");
            compare(body.cursorPosition, 4); verify(body.activeFocus);
            mouseClick(findChild(widget, "deleteNote-1")); waitForRendering(widget);
            mouseClick(findChild(widget, "addNote")); waitForRendering(widget);
            compare(widget.selectedIndex, 0);
            verify(visibleChild(widget, "noteTitle").activeFocus);
            keyClick(Qt.Key_F);
            compare(widget.snapshot()[0].title, "f");
            mouseClick(findChild(widget, "undoDelete")); waitForRendering(widget);
            compare(widget.snapshot().map(function(note) { return note.title; }).join("|"), "f|Before I leave|Useful commands");
            compare(widget.selectedIndex, 2);
            compare(body.text, "hyprctl monitors\nwpctl status");
            compare(widget.snapshot()[1].body, "Keep my current note");
            widget.newNotePosition = "Bottom";
            mouseClick(findChild(widget, "addNote")); waitForRendering(widget);
            compare(widget.selectedIndex, 3);
            verify(visibleChild(widget, "noteTitle").activeFocus);
            keyClick(Qt.Key_L);
            compare(widget.snapshot().map(function(note) { return note.title; }).join("|"), "f|Before I leave|Useful commands|l");
        }
        function test_list_height_keeps_selection_visible() {
            for (let i = 0; i < 10; i++) widget.noteStore.add(false);
            const list = findChild(widget, "noteList");
            const body = visibleChild(widget, "noteBody");
            body.text = "Keep the selected note";
            body.forceActiveFocus(); body.cursorPosition = 4;
            for (const density of ["Compact", "Comfortable", "Spacious"]) {
                widget.listDensity = density;
                let shortHeight = 0;
                for (const rows of [2, 8]) {
                    widget.visibleNotes = rows;
                    waitForRendering(widget);
                    tryVerify(function() {
                        const row = findChild(widget, "selectNote-11");
                        if (!row) return false;
                        const point = row.mapToItem(list, 0, 0);
                        return point.y >= -1 && point.y + row.height <= list.height + 1;
                    });
                    if (rows === 2) shortHeight = list.height; else verify(list.height > shortHeight);
                    compare(body.text, "Keep the selected note");
                    compare(body.cursorPosition, 4); verify(body.activeFocus);
                }
            }
            widget.newNotePosition = "Top";
            mouseClick(findChild(widget, "addNote")); waitForRendering(widget);
            widget.visibleNotes = 2; widget.width = 300;
            waitForRendering(widget);
            tryVerify(function() {
                const row = findChild(widget, "selectNote-0");
                if (!row) return false;
                const point = row.mapToItem(list, 0, 0);
                return point.y >= -1 && point.y + row.height <= list.height + 1;
            });
            compare(widget.selectedIndex, 0);
            compare(widget.snapshot()[12].body, "Keep the selected note");
        }
        function test_typing_switching_and_add() {
            compare(widget.noteCount, 2);
            let title = visibleChild(widget, "noteTitle");
            verify(title !== null);
            mouseClick(title); keyClick(Qt.Key_A, Qt.ControlModifier); keyClick(Qt.Key_Q);
            compare(widget.snapshot()[0].title, "q");
            let body = visibleChild(widget, "noteBody");
            mouseClick(body); keyClick(Qt.Key_A, Qt.ControlModifier); keyClick(Qt.Key_X); keyClick(Qt.Key_Return); keyClick(Qt.Key_Y);
            compare(widget.snapshot()[0].body, "x\ny");
            select(1);
            compare(visibleChild(widget, "noteTitle").text, "Useful commands");
            select(0);
            compare(visibleChild(widget, "noteTitle").text, "q");
            compare(visibleChild(widget, "noteBody").text, "x\ny");
            mouseClick(findChild(widget, "addNote"));
            compare(widget.noteCount, 3);
            tryVerify(function() { const title = visibleChild(widget, "noteTitle"); return title !== null && title.activeFocus; });
            keyClick(Qt.Key_N);
            compare(widget.snapshot()[widget.selectedIndex].title, "n");
        }
        function test_plain_text_and_long_notes() {
            const literal = "<b>継衛</b> & {{example}}";
            widget.noteStore.edit(0, "title", literal);
            widget.noteStore.edit(0, "body", Array(100).fill(literal).join("\n"));
            widget.selectNote(0);
            compare(visibleChild(widget, "noteTitle").text, literal);
            const body = visibleChild(widget, "noteBody");
            compare(body.textFormat, TextEdit.PlainText);
            compare(body.text, Array(100).fill(literal).join("\n"));
            verify(body.contentHeight > 130);
            widget.width = 300;
            waitForRendering(widget);
            verify(visibleChild(widget, "noteTitle").width > 80);
        }
        function test_many_notes() {
            for (let i = 0; i < 30; i++) widget.noteStore.add(false);
            compare(widget.noteCount, 32);
            widget.noteStore.edit(widget.selectedIndex, "body", "last note");
            widget.selectNote(0);
            compare(widget.snapshot()[31].body, "last note");
            waitForRendering(widget);
            const height = widget.height;
            for (let i = 0; i < 30; i++) widget.noteStore.add(false);
            waitForRendering(widget);
            compare(widget.height, height);
        }
        function test_drawer_or_stack_collapse() {
            const close = findChild(widget, "closeNotes");
            if (close) {
                visibleChild(widget, "noteTitle").forceActiveFocus(); keyClick(Qt.Key_Escape);
                compare(widget.opened, false);
                verify(visibleChild(widget, "noteBody") === null);
                mouseClick(close); compare(widget.opened, true);
                compare(visibleChild(widget, "noteTitle").text, "Before I leave");
            } else if ("showGrid" in widget) {
                mouseClick(visibleChild(widget, "selectNote-0"));
                compare(widget.selectedIndex, -1);
                verify(visibleChild(widget, "noteBody") === null);
                mouseClick(visibleChild(widget, "summaryNote-0"));
                compare(widget.selectedIndex, 0);
            }
        }
        function test_delete_all_and_undo() {
            if (!("allowDelete" in widget) || !widget.allowDelete) return;
            const original = JSON.stringify(widget.snapshot());
            mouseClick(findChild(widget, "deleteNote-0")); compare(widget.noteCount, 1); waitForRendering(widget);
            mouseClick(findChild(widget, "deleteNote-0")); compare(widget.noteCount, 0); waitForRendering(widget);
            verify(findChild(widget, "emptyNotes").visible);
            mouseClick(findChild(widget, "undoDelete")); compare(widget.noteCount, 1); waitForRendering(widget);
            mouseClick(findChild(widget, "undoDelete")); compare(widget.noteCount, 2);
            compare(JSON.stringify(widget.snapshot()), original);
            verify(!findChild(widget, "undoDelete").visible);
        }
        function test_instances_are_independent() {
            const other = createTemporaryObject(notesComponent, testRoot);
            widget.noteStore.edit(0, "title", "private session");
            widget.noteStore.add(false);
            compare(other.noteCount, 2);
            compare(other.snapshot()[0].title, "Before I leave");
        }
    }
}
