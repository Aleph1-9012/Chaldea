// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic

Column {
    id: editor
    required property NoteStore store
    property int noteIndex: store.selected
    property string writingFont: "Inter"
    property string titleFont: writingFont
    property color ink: "#e8e8e8"
    property color titleInk: ink
    property color muted: "#909090"
    property color rule: "#4a4a4a"
    property color accentInk: ink
    property color accent: "#cc1515"
    property int bodySize: 16
    property int titleSize: 18
    property int titleIndent: 0
    property int bodyHeight: 142
    property bool titleRule: true
    property bool syncing: false
    property string counterMode: "Off"
    readonly property int wordCount: body.text.trim() ? body.text.trim().split(/\s+/).length : 0
    // Qt's string iteration can expose UTF-16 units; count surrogate pairs once.
    readonly property int characterCount: body.text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "_").length
    readonly property string statistics: counterMode === "Words" ? wordCount + (wordCount === 1 ? " word" : " words")
        : counterMode === "Characters" ? characterCount + (characterCount === 1 ? " character" : " characters") : ""
    property alias titleField: title
    property alias bodyField: body
    spacing: 10
    function loadNote(): void {
        syncing = true;
        const note = store.note(noteIndex);
        title.text = note ? note.title : "";
        body.text = note ? note.body : "";
        syncing = false;
    }
    function focusTitle(): void { title.forceActiveFocus(); }
    onNoteIndexChanged: loadNote()
    Component.onCompleted: loadNote()
    Connections { target: editor.store; function onSelectionChanged(): void { editor.loadNote(); } }
    TextField {
        id: title
        objectName: "noteTitle"
        x: editor.titleIndent
        width: editor.width - editor.titleIndent
        height: editor.titleSize + 24
        padding: 0
        bottomPadding: 10
        maximumLength: 120
        font.family: editor.titleFont
        font.pixelSize: editor.titleSize
        color: editor.titleInk
        selectionColor: editor.accent
        selectedTextColor: editor.accentInk
        placeholderText: "Untitled note"
        placeholderTextColor: editor.muted
        selectByMouse: true
        Accessible.name: "Note title"
        background: Rectangle {
            color: "transparent"
            Rectangle { visible: editor.titleRule || title.activeFocus; anchors.bottom: parent.bottom; width: parent.width; height: 1; color: title.activeFocus ? editor.accent : editor.rule }
        }
        onTextEdited: { if (!editor.syncing) editor.store.edit(editor.noteIndex, "title", text); }
    }
    ScrollView {
        id: scroll
        objectName: "writingArea"
        width: editor.width
        height: editor.bodyHeight
        clip: true
        contentWidth: availableWidth
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        TextArea {
            id: body
            objectName: "noteBody"
            padding: 0
            width: scroll.availableWidth
            wrapMode: TextEdit.Wrap
            textFormat: TextEdit.PlainText
            font.family: editor.writingFont
            font.pixelSize: editor.bodySize
            color: editor.ink
            selectionColor: editor.accent
            selectedTextColor: editor.accentInk
            placeholderText: "Write something to remember…"
            placeholderTextColor: editor.muted
            selectByMouse: true
            activeFocusOnTab: true
            Accessible.name: "Note contents"
            background: Rectangle { color: "transparent"; border.width: body.activeFocus ? 1 : 0; border.color: editor.rule }
            onTextChanged: { if (!editor.syncing) editor.store.edit(editor.noteIndex, "body", text); }
        }
    }
}
