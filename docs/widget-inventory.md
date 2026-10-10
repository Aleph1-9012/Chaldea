# Widget inventory

The library contains 38 designs, all with native QML exports: six Quick notes, five Players, eleven Glyphs, seven Interactive art widgets, and nine Lockscreens. No HTML-only drafts remain. Lockscreens export visual components and demo interactions; they do not implement authentication or desktop session locking. This file is the one place these counts are recorded; `make check` prints the current totals. Each distinct design has its own catalog entry, preview document, thumbnail, and settings. Palettes and other appearance controls remain settings. Archive paths identify source provenance; the original archive is not required to build this repository.

| Source page | Individual widgets |
| --- | --- |
| `tsugumori-five-glyph-studies.html` | [Recursive relays](../widgets/glyphs/recursive-relays/README.md), [Branch grammar](../widgets/glyphs/branch-grammar/README.md), [Shifted script](../widgets/glyphs/shifted-script/README.md), [Oblique ligatures](../widgets/glyphs/oblique-ligatures/README.md), [Radical exchange](../widgets/glyphs/radical-exchange/README.md) |
| `tsugumori-drift-and-tsumugi.html` | [Fish in space](../widgets/interactive-art/fish-in-space/README.md) |
| `tsugumori-eight-play-studies.html` | [Magnetic powder](../widgets/interactive-art/magnetic-powder/README.md) |
| `tsugumori-play-lab.html` | [Specimen chamber](../widgets/interactive-art/specimen-chamber/README.md), [Orbital playground](../widgets/interactive-art/orbital-playground/README.md), [Resonance sculpture](../widgets/interactive-art/resonance-sculpture/README.md), [Signal hunting](../widgets/interactive-art/signal-hunting/README.md), [Gravity sandbox](../widgets/interactive-art/gravity-sandbox/README.md) |

The existing entries remain available:

- [Phase lock](../widgets/lockscreens/phase-lock/formation/README.md)
- [Glyph Bay typing](../widgets/glyphs/glyph-bay-typing/README.md)

Open a design with `/?widget=<widget-id>`. Each widget has its own in-memory state. Leaving a preview resets it.

## Native families

All five families have native QML exports. Each family's components, shared files, and inspection notes are in its category folder: [Quick notes](../widgets/quick-notes/README.md), [Player](../widgets/player/README.md), [Glyphs](../widgets/glyphs/README.md), [Interactive art](../widgets/interactive-art/README.md), and [Lockscreens](../widgets/lockscreens/README.md).

## Archive import

The library retains 24 entries from the archive import alongside the 14 earlier designs. All 125 HTML files are accounted for in [the import manifest](archive-imports.json), including excluded categories, duplicates, and palette companions. Auxiliary images, PDFs, and helper scripts remain references. The archive is unchanged.

The import manifest records excluded sources and designs, consolidated lockscreen variants, and palette companions.

Punch record, Shutter bank, Formation field, Stencil assembly, and Typesetter belong to Glyphs and now have native exports. They retain artwork and input in the Glyph preview host, with lockscreen clocks, power actions, and surrounding layouts removed. Their IDs and settings keys are unchanged.

Lockscreens retain one entry per layout; artwork and motion variations share that representative. [The lockscreen guide](../widgets/lockscreens/README.md) lists the retained previews and their selected artwork. Only the entries listed below are available in the catalog.

| Category | Widgets |
| --- | ---: |
| Glyphs | 11 |
| Interactive art | 7 |
| Lockscreens | 9 |
| Player | 5 |
| Quick notes | 6 |

### Retained source pages

| Source page | Widgets |
| --- | --- |
| `lockscreen/tsugumori-afk-layout-previews.html` | [Afk layout previews / Relay index / Relay tiles](../widgets/lockscreens/afk-layouts/relay-index/relay-tiles/README.md), [Afk layout previews / Type folio / Relay tiles](../widgets/lockscreens/afk-layouts/type-folio/relay-tiles/README.md) |
| `lockscreen/tsugumori-lockscreen-editorial-studies.html` | [Lockscreen editorial studies / Assembly mark / Compound glyph](../widgets/lockscreens/editorial/assembly-mark/compound-glyph/README.md), [Lockscreen editorial studies / Foundry poster / Compound glyph](../widgets/lockscreens/editorial/foundry-poster/compound-glyph/README.md), [Lockscreen editorial studies / Reverse print / Compound glyph](../widgets/lockscreens/editorial/reverse-print/compound-glyph/README.md) |
| `lockscreen/tsugumori-lockscreen-print-iterations.html` | [Lockscreen print iterations / Index spine / Compound glyph](../widgets/lockscreens/print/index-spine/compound-glyph/README.md), [Lockscreen print iterations / Open masthead / Compound glyph](../widgets/lockscreens/print/open-masthead/compound-glyph/README.md) |
| `lockscreen/tsugumori-mechanical-lockscreen-studies.html` | [Punch record](../widgets/glyphs/punch-record/README.md) |
| `lockscreen/tsugumori-reactive-lockscreen-studies.html` | [Reactive lockscreen studies / Relay tiles](../widgets/lockscreens/reactive/relay-tiles/README.md), [Shutter bank](../widgets/glyphs/shutter-bank/README.md), [Formation field](../widgets/glyphs/formation-field/README.md), [Stencil assembly](../widgets/glyphs/stencil-assembly/README.md), [Typesetter](../widgets/glyphs/typesetter/README.md) |
| `player/tsugumori-player-directions.html` | [Player directions / Matrix](../widgets/player/matrix/README.md), [Player directions / Sleeve](../widgets/player/sleeve/README.md), [Player directions / Rail](../widgets/player/rail/README.md), [Player directions / Ledger](../widgets/player/ledger/README.md), [Player directions / Title](../widgets/player/title/README.md) |
| `quick-notes/tsugumori-notes-a-cassette.html` | [Notes a cassette](../widgets/quick-notes/cassette/README.md) |
| `quick-notes/tsugumori-notes-b-index.html` | [Notes b index](../widgets/quick-notes/index/README.md) |
| `quick-notes/tsugumori-notes-c-console.html` | [Notes c console](../widgets/quick-notes/console/README.md) |
| `quick-notes/tsugumori-notes-d-ash.html` | [Notes d ash](../widgets/quick-notes/ash/README.md) |
| `quick-notes/tsugumori-notes-preview.html` | [Notes preview](../widgets/quick-notes/preview/README.md) |
| `quick-notes/tsugumori-notes-refined.html` | [Notes refined](../widgets/quick-notes/refined/README.md) |
