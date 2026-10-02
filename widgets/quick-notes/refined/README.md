# Tsugumori / Notes refined

The refined drawer has editable notes, a note index, New note, Escape/collapse/reopen, individual deletion, an empty state, and Undo. Undo restores deletions in reverse order, including their text and position. Frame, writing size, note font, and grid strength remain settings. Refined also offers writing-area height, title size, note-list spacing, optional text counts, and note-number visibility.

## Run

Download the ZIP and extract all files into their own folder. Keep `Widget.qml` beside its helper QML files. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The example opens a regular, resizable window. The component itself uses Qt Quick, Qt Quick Controls Basic, and QtQml Models. It does not require desktop services. For an existing QML layout, import the extracted folder under an alias and instantiate its `Widget`:

```qml
import "./quick-notes" as Notes

Notes.Widget {
    width: 420
}
```

Use Tab, Shift+Tab, Enter/Space, and the editor's standard selection and clipboard shortcuts. Long notes and long note lists scroll inside the widget. Customization properties are declared at the top of `Widget.qml`; browser Copy and Download use the same values.

## State and integration

Each component starts with two sample notes. Note text stays in memory until that component is destroyed. Closing the demo window loses the session; collapse/reopen and switching notes preserve it. There is no disk storage, network connection, or live desktop integration. A host can listen to `notesEdited()` and read `snapshot()` for copies of the current notes. `selectNote(index)`, `noteCount`, and `selectedIndex` expose selection state. Changes to appearance settings preserve the current notes.

Share Tech Mono and Inter are used when installed, with Qt's system font fallback otherwise. Fonts are not bundled. Native code renders user text as plain text. Original widget code and the preview adapter use 0BSD; include `LICENSE` when redistributing.

## Source

This is one design from the owner-supplied `Lib-assests/quick-notes/tsugumori-notes-refined.html`. Distinct designs have separate library entries. Appearance settings remain controls.

Source SHA-256: `048d8c6954fb62e64d132844c8e34cdd96775fb419513f32c5d9d0c475b309a5`. The source archive is unchanged.

## Appearance

Use Palette to choose Original, Cobalt, Forest, Paper, or Custom. Custom uses the three color pickers for background, text, and accent. Muted text, dividers, grids, and selection colors follow the chosen palette. Custom color values remain available when you switch presets.

The original square corners and frame widths are fixed. Reset restores the design's original appearance without deleting session notes. Appearance settings are included in copied QML and ZIP downloads.

## Reading and writing

- Writing area height sets the editor from 100 to 280 px; long text still scrolls.
- Title size adjusts headings from 14 to 24 px independently of the note body.
- Note list spacing offers Compact, Comfortable, and Spacious rows. Visible note rows sets the list height from two to eight rows, with four by default. Longer lists scroll and keep the active note in view.
- New note position places new notes at the Top or Bottom of the list. Bottom is the default. Existing notes keep their order when you change this setting. New notes receive focus, and Undo preserves deleted notes' position relative to existing notes even after adding at the top.
- Text count shows Words, Characters, or Off above the current note. It counts only the body. Words are separated by whitespace; character counts include spaces and line breaks and count Unicode code points, not bytes.
- Show note numbers toggles prefixes in the note list. The current-note position stays visible above the editor.

Changing these controls preserves note text, selection, deletion history, and editor focus. All options are included in copied QML and ZIP downloads.
