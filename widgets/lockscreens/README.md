# Lockscreens

Each retained preview represents one layout. Glyph, artwork, background, and motion variations from the archive share that representative instead of appearing as separate catalog entries. The current library counts are in [the inventory](../../docs/widget-inventory.md).

The retained AFK previews use Relay tiles. Editorial and print previews use Compound glyph. Those selections remain fixed in the retained previews. The original Phase lock represents the centered panel layout, including the related Folio and background or motion studies. Existing IDs and the retained previews' behavior are unchanged.

| Study group | Retained previews |
| --- | --- |
| AFK layouts | [Relay index](afk-layouts/relay-index/relay-tiles/README.md), [Type folio](afk-layouts/type-folio/relay-tiles/README.md) |
| Editorial | [Assembly mark](editorial/assembly-mark/compound-glyph/README.md), [Foundry poster](editorial/foundry-poster/compound-glyph/README.md), [Reverse print](editorial/reverse-print/compound-glyph/README.md) |
| Phase lock | [Formation](phase-lock/formation/README.md) |
| Print | [Index spine](print/index-spine/compound-glyph/README.md), [Open masthead](print/open-masthead/compound-glyph/README.md) |
| Reactive | [Relay tiles](reactive/relay-tiles/README.md) |

Punch record, Shutter bank, Formation field, Stencil assembly, and Typesetter now belong to [Glyphs](../glyphs/README.md). They retain their artwork and input as HTML drafts with the same IDs and settings keys. Their lockscreen clocks, power actions, and surrounding layouts were removed.

The [archive manifest](../../docs/archive-imports.json) preserves every source page and its SHA-256, records removed designs, and identifies retained layouts for consolidated variants. The source archive is unchanged; removed adaptations remain in Git history.

These previews are HTML drafts with local demo state. They do not authenticate, lock the desktop, or provide native exports. Keep their declared shared preview adapter and 0BSD license when editing or porting them.
