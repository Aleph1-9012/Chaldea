# Quick notes

Cassette, Index, Console, Ash, Preview, and Refined each have an independent QML export. The exports preserve note creation, editing and selection, each design’s collapse or index controls, and Refined’s deletion and Undo. Settings remain appearance controls. Each exported component owns its in-memory notes; no desktop services or storage are connected.

## Shared files

`_shared/qml/` holds the helpers these designs use unchanged: `NotesBase.qml`, `NoteStore.qml`, `NoteButton.qml`, `NoteEditor.qml`, `NoteGrid.qml`, `NoteList.qml`, `NotesDrawer.qml`, and the `shell.qml` launcher. `_shared/preview/` holds `appearance.js` and `options.js` for the browser previews. Each widget folder keeps its `Widget.qml.tmpl`, any component of its own such as `NotesConsole.qml`, its preview, thumbnail, and README. A widget declares only the helpers it uses.

Develop component refinements in Notes refined first. Copy the shared file to the same path under `refined/` and change the copy; Refined then uses it and the other five designs are unaffected. Roll a refinement out only after maintainer approval, by moving that file back to `_shared/`.

## Components

The exports use Qt Quick components with an instance-local `NoteStore`. It updates ListModel roles without replacing focused editors, returns copied note data through `snapshot()`, and keeps Refined’s deletion history in memory. Appearance changes leave note state intact. Each definition includes palette presets and three custom colors. `NotesBase` resolves the native theme; the previews connect directly to the preview runtime and apply matching CSS tokens. Color changes update the existing component without recreating editors. Browser note contents are never embedded in the generated QML.

All six widgets have fixed frame widths and square corners, with shared reading and writing controls.
