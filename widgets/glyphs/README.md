# Glyphs

Glyphs has six designs with native QML exports and five HTML drafts. Branch grammar, Glyph Bay typing, Oblique ligatures, Radical exchange, Recursive relays, and Shifted script have independent QML exports and are included in production builds. Each uses the original drawing rules in both HTML and QML. Typing, deletion, motion settings, and the Unlock curtain remain direct interactions.

[Punch record](punch-record/README.md), [Shutter bank](shutter-bank/README.md), [Stencil assembly](stencil-assembly/README.md), [Formation field](formation-field/README.md), and [Typesetter](typesetter/README.md) are HTML drafts moved from Lockscreens at the owner's request. They keep their original IDs and settings keys. Their artwork and input use the current Glyph preview host; the lockscreen clocks, power actions, and surrounding layouts were removed. They have no native QML exports or downloads and are omitted from production builds. [The inventory](../../docs/widget-inventory.md) records the library totals, and [the archive manifest](../../docs/archive-imports.json) preserves their source pages and hashes.

These are visual components with a dummy-input field and an Unlock curtain preview. They do not implement authentication or a desktop session lock.

## Shared files

`_shared/qml/` holds `GlyphWidget.qml`, `GlyphText.qml`, and the `shell.qml` launcher. Only the six native designs use these files. Each native widget folder keeps its own `assets/GlyphArt.js`, `qml/GlyphArtwork.qml`, `Widget.qml.tmpl`, preview, thumbnail, and README. The five HTML drafts do not use the shared QML files.

## Components

Each native design's `GlyphArt.js` is a plain JavaScript drawing helper used by both its browser preview and its native component, so typing length, deletion, and the artwork's geometry follow the same rules. Keep each extracted `GlyphArt.js` beside its QML files. The native components retain only bounded dummy-input length and placeholders, animate between lengths, and replay the original curtain. Entered characters are replaced after committed edits; only the bounded length drives the drawing. Timing, motion, and emphasis settings preserve that length and bind through the shared QML generator. The native animation setting can disable transitions, and hiding a component stops pending motion and replay timers.

## Inspect a change

Inspect every changed preview's typing, pasting, selection deletion, reversing input, motion interruption, clearing, and replay cancellation. For a native entry, also use the documented Bun export command and the exported `shell.qml` in an isolated configuration. The generic library checker discovers the JavaScript helpers and export mappings without new test registration; the HTML drafts require browser inspection until they have native exports.
