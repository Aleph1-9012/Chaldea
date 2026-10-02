# Glyphs

Branch grammar, Glyph Bay typing, Oblique ligatures, Radical exchange, Recursive relays, and Shifted script each have an independent QML export and are included in production builds. Each uses the original drawing rules in both HTML and QML. Typing, deletion, motion settings, and the Unlock curtain remain direct interactions.

These are visual components with a dummy-input field and an Unlock curtain preview. They do not implement authentication or a desktop session lock.

## Shared files

`_shared/qml/` holds `GlyphWidget.qml`, `GlyphText.qml`, and the `shell.qml` launcher, which all six designs use unchanged. Each widget folder keeps its own `assets/GlyphArt.js`, `qml/GlyphArtwork.qml`, `Widget.qml.tmpl`, preview, thumbnail, and README.

## Components

Each design’s `GlyphArt.js` is a plain JavaScript drawing helper used by both its browser preview and its native component, so typing length, deletion, and the artwork’s geometry follow the same rules. Keep each extracted `GlyphArt.js` beside its QML files. The native components retain only bounded dummy-input length and placeholders, animate between lengths, and replay the original curtain. Entered characters are replaced after committed edits; only the bounded length drives the drawing. Timing, motion, and emphasis settings preserve that length and bind through the shared QML generator. The native animation setting can disable transitions, and hiding a component stops pending motion and replay timers.

## Inspect a change

Use the documented Bun export command and the exported `shell.qml` in an isolated configuration. Browser and native inspection should include pasting, selection deletion, reversing input, motion interruption, clearing, and replay cancellation. The generic library checker discovers the JavaScript helpers and export mappings without new test registration.
