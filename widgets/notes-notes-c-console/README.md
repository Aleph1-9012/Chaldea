# Tsugumori / Notes c console

The console has a collapsible Notes list, title and body editing, and New note. Selecting a note closes its list. Spacing and heading emphasis remain settings.

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

This is one design from the owner-supplied `Lib-assests/quick-notes/tsugumori-notes-c-console.html`. Distinct designs have separate library entries. Appearance settings remain controls.

Source SHA-256: `8adf176cab3dfd1c751d2b1e4f7f82a560a9089838c9f2462c7c5cf1b2eb7431`. The source archive is unchanged.

## Appearance

Use Palette to choose Original, Cobalt, Forest, Paper, or Custom. Cassette retains its Bone and Red presets in place of Original. Custom uses the three color pickers for background, text, and accent. Muted text, dividers, grids, and selection colors follow the chosen palette. Custom color values remain available when you switch presets.

The original square corners and frame widths are fixed. Reset restores the design's original appearance without deleting session notes. Appearance settings are included in copied QML and ZIP downloads.

## Reading and writing

Writing area height sets the body from 100 to 280 px. Long text scrolls inside it. Title size sets headings from 14 to 24 px. Text count shows Words, Characters, or Off for the active note's body. Words are separated by whitespace; characters count Unicode code points, including spaces and line breaks.

Note list spacing offers Compact, Comfortable, and Spacious. Visible note rows sets the scrolling list height from two to eight rows, with four by default. The active note stays in view when the list changes. Show note numbers toggles the list prefixes.

New note position places future notes at Top or Bottom without reordering existing notes. Reset restores this design's defaults while keeping note text and selection. These controls are included in copied QML and ZIP downloads.

Spacing controls the console frame padding. Writing area height controls the editor independently.
