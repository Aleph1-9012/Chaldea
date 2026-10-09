# Lockscreens

Each retained widget represents one layout and includes a native QML export. Glyph, artwork, background, and motion variations from the archive share that representative instead of appearing as separate catalog entries. The current library counts are in [the inventory](../../docs/widget-inventory.md).

The retained AFK previews use Relay tiles. Editorial and print previews use Compound glyph. Those selections remain fixed in the retained previews. The original Phase lock represents the centered panel layout, including the related Folio and background or motion studies. Existing IDs and the retained previews' behavior are unchanged.

| Study group | Retained previews |
| --- | --- |
| AFK layouts | [Relay index](afk-layouts/relay-index/relay-tiles/README.md), [Type folio](afk-layouts/type-folio/relay-tiles/README.md) |
| Editorial | [Assembly mark](editorial/assembly-mark/compound-glyph/README.md), [Foundry poster](editorial/foundry-poster/compound-glyph/README.md), [Reverse print](editorial/reverse-print/compound-glyph/README.md) |
| Phase lock | [Formation](phase-lock/formation/README.md) |
| Print | [Index spine](print/index-spine/compound-glyph/README.md), [Open masthead](print/open-masthead/compound-glyph/README.md) |
| Reactive | [Relay tiles](reactive/relay-tiles/README.md) |

Punch record, Shutter bank, Formation field, Stencil assembly, and Typesetter belong to [Glyphs](../glyphs/README.md). They now have native artwork and input exports with the same IDs and settings keys. Their lockscreen clocks, power actions, and surrounding layouts were removed.

The [archive manifest](../../docs/archive-imports.json) preserves every source page and its SHA-256, records removed designs, and identifies retained layouts for consolidated variants. The source archive is unchanged; removed adaptations remain in Git history.

## Native components

Each widget keeps its own native composition, input handling, artwork, and launcher. The selected artwork follows the original drawing rules. Native input retains only bounded length and placeholders after committed edits. Typing, selection deletion, reversal, unlock previews, and available power preview dialogs remain direct interactions. Appearance settings bind through the same generator used for Copy and Download.

These exports are visual components with local demo state. They do not authenticate, lock the desktop session, or execute power commands. The exported `shell.qml` opens a regular preview window. Unlock requests and supported power previews emit signals for a separate host. Phase lock retains its reversible lock/clear sequence. Each widget's README documents its properties and signals.

## Files and inspection

The native helpers are kept in each widget folder; no category-wide QML helpers were introduced. Each output file list includes its native files, launcher, instructions, and 0BSD license. Save all listed files together, preserving their paths. The browser previews keep their existing shared adapter where declared. Fonts use installed system families and fallback; no font files are bundled.

Use the documented Bun export command and load the exact exported `shell.qml` in an isolated Quickshell configuration. Inspect typing and deletion, keyboard navigation, animation reversal, power preview dismissal where present, and desktop and narrow layouts. The generic library checker discovers all settings and export mappings automatically. Native inspection verifies the visual components and local interactions, not authentication or compositor integration.
