# Glyphs

All eleven Glyphs designs have native QML exports and are included in production builds. Each uses the same drawing rules in HTML and QML. Typing, deletion, motion settings, and the Unlock curtain remain direct interactions.

Oblique ligatures uses the owner's requested redesign: five connected rows of slanted characters with varying widths and nested letter fragments. Each character advances one glyph in reading order, with a red highlight following the active glyph. Its damped response handles retargeting and deletion without overshoot. Radical exchange uses fewer cells, brighter main strokes, and staggered movement within its paired-fragment design. Both default to a 220 ms input transition. Branch grammar has stronger stroke weights and higher-resolution rendering. The other glyph designs retain their original geometry and timing.

[Punch record](punch-record/README.md), [Shutter bank](shutter-bank/README.md), [Stencil assembly](stencil-assembly/README.md), [Formation field](formation-field/README.md), and [Typesetter](typesetter/README.md) moved from Lockscreens at the owner's request. Their native ports keep the original IDs and settings keys. Their artwork and input use the same Glyph host as the other designs; the lockscreen clocks, power actions, and surrounding layouts remain removed. [The inventory](../../docs/widget-inventory.md) records the library totals, and [the archive manifest](../../docs/archive-imports.json) preserves their source pages and hashes.

These are visual components with a dummy-input field and an Unlock curtain preview. They do not implement authentication or a desktop session lock.

## Shared files

`_shared/qml/` holds `GlyphWidget.qml`, `GlyphText.qml`, and the `shell.qml` launcher. Oblique ligatures overrides `GlyphWidget.qml` locally for its frame-driven input response; the other ten use the shared host. All eleven use the shared text component and launcher. Each widget folder keeps its own `assets/GlyphArt.js`, `qml/GlyphArtwork.qml`, `qml/Widget.qml.tmpl`, preview, thumbnail, and README.

## Components

Each native design's `GlyphArt.js` is a plain JavaScript drawing helper used by both its browser preview and its native component, so typing length, deletion, and the artwork's geometry follow the same rules. Keep each extracted `GlyphArt.js` beside its QML files. The native components retain only bounded dummy-input length and placeholders, animate between lengths, and replay the original curtain. Entered characters are replaced after committed edits; only the bounded length drives the drawing. Timing, motion, and emphasis settings preserve that length and bind through the shared QML generator. The native animation setting can disable transitions, and hiding a component stops pending motion and replay timers.

## Inspect a change

Inspect every changed preview's typing, pasting, selection deletion, reversing input, motion interruption, clearing, and replay cancellation. Also use the documented Bun export command and the exported `shell.qml` in an isolated configuration. Each widget's README records its native inspection. The generic library checker discovers the JavaScript helpers and export mappings without new test registration.
