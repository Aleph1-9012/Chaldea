# Tsugumori / Lockscreen editorial studies / Reverse print / Compound glyph

Reverse print retains the original compound glyph, layout, and dummy-input animation in a native QML component. The browser preview remains interactive.

## Run

Download and extract the complete ZIP. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/extracted-folder/shell.qml
```

The launcher opens a resizable preview window and leaves desktop configuration alone. Keep every exported file together. Qt Quick, Qt Quick Controls Basic, JetBrains Mono, and Noto Sans CJK JP provide the native presentation. No fonts are bundled; font fallback can affect text metrics.

Embed `Widget.qml` as a visual component and give it a width and height. It has a responsive `implicitHeight` for scrolling hosts. Bind `userName`, `hours`, `minutes`, and `dateText` to host data if needed. Their defaults match the original demonstration.

The existing `s0Duration` and `s1Motion` settings control input transition timing and animation. `focusInput()` and `setInputLength(length)` support integration. `inputLength`, `phase`, `previewing`, `statusText`, and `powerAction` expose the demonstration state.

## Interaction and limits

Use dummy text only. Typing changes the glyph, deletion reverses it, Escape clears the input, and Enter or the arrow button previews unlock. Committed edits retain only a bounded length and masked placeholders. Nothing persists between sessions. Disabling input animation settles the glyph immediately; hiding the component also stops the active preview.

`previewRequested(int length)` reports an unlock preview after nonempty dummy input. `powerRequested(string action)` reports opening the restart or shutdown preview dialog. The dialog has only a Back button; the signal does not confirm a system action. Tab moves between controls, Escape closes the dialog, and closing it restores focus.

This component does not authenticate, lock a desktop session, or run power commands. Its launcher is a regular preview window. A real lockscreen needs a separate host for authentication, secure session locking, and any permitted system operations.

`GlyphArt.js` preserves the original compound-glyph drawing rules. The native layout follows the original desktop and narrow arrangements.

## Source and license

This is one design from the owner-supplied `Lib-assests/lockscreen/tsugumori-lockscreen-editorial-studies.html`. Distinct designs have separate library entries. Appearance settings remain controls.

Original widget code, the native implementation, and the preview adapter use 0BSD. The download includes `LICENSE`. No desktop services are connected.

Source SHA-256: `ae4a17c3627cad0c01261d227385da2c391c6bee60be3bfd2a66048e96d882c1`. The source archive is unchanged.
