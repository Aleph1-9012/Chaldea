# Widget inventory

The library contains 42 published entries: six Quick notes, five Players, eleven Glyphs, nine Interactive art widgets, and eleven Sliders. All have native QML exports and are included in production builds. Sliders expose a percentage value and user-change signal for a host model. Keep this inventory and the main README's overview aligned with the catalog; `make check` prints the current totals. Each distinct design has its own catalog entry, preview document, thumbnail, and settings. Palettes and other appearance controls remain settings. Archive paths identify source provenance; the original archive is not required to build this repository.

[Sea turtle](../widgets/interactive-art/sea-turtle/README.md), identified as `interactive-art-sea-turtle`, is published with a native Quickshell export and browser preview sharing its vector artwork and skeleton. Its preview bundle and native export retain the reference-derived artwork notice. The earlier Tidal turtle and Skeleton studies are kept outside this repository and do not appear in previews or builds.

| Source page | Individual widgets |
| --- | --- |
| `tsugumori-five-glyph-studies.html` | [Recursive relays](../widgets/glyphs/recursive-relays/README.md), [Branch grammar](../widgets/glyphs/branch-grammar/README.md), [Shifted script](../widgets/glyphs/shifted-script/README.md), [Oblique ligatures](../widgets/glyphs/oblique-ligatures/README.md), [Radical exchange](../widgets/glyphs/radical-exchange/README.md) |
| `tsugumori-drift-and-tsumugi.html` | [Fish in space](../widgets/interactive-art/fish-in-space/README.md) |
| `tsugumori-eight-play-studies.html` | [Magnetic powder](../widgets/interactive-art/magnetic-powder/README.md) |
| `tsugumori-play-lab.html` | [Specimen chamber](../widgets/interactive-art/specimen-chamber/README.md), [Orbital playground](../widgets/interactive-art/orbital-playground/README.md), [Resonance sculpture](../widgets/interactive-art/resonance-sculpture/README.md), [Signal hunting](../widgets/interactive-art/signal-hunting/README.md), [Gravity sandbox](../widgets/interactive-art/gravity-sandbox/README.md) |

[Glyph Bay typing](../widgets/glyphs/glyph-bay-typing/README.md) remains available.

Open a design with `/?widget=<widget-id>`. Each widget has its own in-memory state. Leaving a preview resets it.

## Native families

All five active families have native QML exports. Each family's components, shared files, and inspection notes are in its category folder: [Quick notes](../widgets/quick-notes/README.md), [Player](../widgets/player/README.md), [Glyphs](../widgets/glyphs/README.md), [Interactive art](../widgets/interactive-art/README.md), and [Sliders](../widgets/sliders/README.md).

## Interactive art addition

[Fish murmuration](../widgets/interactive-art/fish-murmuration/README.md) draws its fish animation in shared browser and Qt code, manually matched to the video in [Ramin Nasibov's post](https://x.com/RaminNasibov/status/2116201987146383447). Pointer movement parts the school. It is published as `interactive-art-fish-murmuration` with adjustable speed and native QML export. Its 0BSD implementation license excludes the private reference footage, which is not packaged.

## Sliders additions

The owner supplied these retained designs in `Lib-assests/chaldea assets/`. Each became a separate widget with matching browser and native controls. Import removed the surrounding visualization wrapper, persistence bridge, unused variants, and remote helper scripts.

| Source page | Widget |
| --- | --- |
| `comb.html` | [Comb](../widgets/sliders/comb/README.md) |
| `slats.html` | [Slats](../widgets/sliders/slats/README.md) |
| `stipple-blade.html` | [Stipple Blade](../widgets/sliders/stipple-blade/README.md) |
| `weave.html` | [Weave](../widgets/sliders/weave/README.md) |
| `louvers.html` | [Louvers](../widgets/sliders/louvers/README.md) |
| `membrane.html` | [Membrane](../widgets/sliders/membrane/README.md) |
| `braid.html` | [Braid](../widgets/sliders/braid/README.md) |
| `fuse.html` | [Fuse](../widgets/sliders/fuse/README.md) |
| `lattice.html` | [Lattice](../widgets/sliders/lattice/README.md) |
| `field.html` | [Field](../widgets/sliders/field/README.md) |
| `interference.html` | [Interference](../widgets/sliders/interference/README.md) |

## Archive import

[The historical import manifest](archive-imports.json) accounts for all 125 original HTML files, including excluded categories, duplicates, palette companions, and subsequently retired entries. Auxiliary images, PDFs, and helper scripts remain references. The archive is unchanged.

The import manifest records excluded sources and designs, consolidated lockscreen variants, and palette companions.

Punch record, Shutter bank, Formation field, Stencil assembly, and Typesetter belong to Glyphs and now have native exports. They retain artwork and input in the Glyph preview host, with lockscreen clocks, power actions, and surrounding layouts removed. Their IDs and settings keys are unchanged.

The Lockscreens family, including Phase Lock, was retired on 4 November 2026 at the owner's request. Its source files and local preview edits were archived outside the repository. The five extracted Glyphs remain active. Published immutable revision files remain in deployment history for existing downloads; retired entries no longer appear in the catalog, navigation, or sitemap.

| Category | Widgets |
| --- | ---: |
| Glyphs | 11 |
| Interactive art | 9 |
| Player | 5 |
| Quick notes | 6 |
| Sliders | 11 |

### Retained source pages

| Source page | Widgets |
| --- | --- |
| `lockscreen/tsugumori-mechanical-lockscreen-studies.html` | [Punch record](../widgets/glyphs/punch-record/README.md) |
| `lockscreen/tsugumori-reactive-lockscreen-studies.html` | [Shutter bank](../widgets/glyphs/shutter-bank/README.md), [Formation field](../widgets/glyphs/formation-field/README.md), [Stencil assembly](../widgets/glyphs/stencil-assembly/README.md), [Typesetter](../widgets/glyphs/typesetter/README.md) |
| `player/tsugumori-player-directions.html` | [Player directions / Matrix](../widgets/player/matrix/README.md), [Player directions / Sleeve](../widgets/player/sleeve/README.md), [Player directions / Rail](../widgets/player/rail/README.md), [Player directions / Ledger](../widgets/player/ledger/README.md), [Player directions / Title](../widgets/player/title/README.md) |
| `quick-notes/tsugumori-notes-a-cassette.html` | [Notes a cassette](../widgets/quick-notes/cassette/README.md) |
| `quick-notes/tsugumori-notes-b-index.html` | [Notes b index](../widgets/quick-notes/index/README.md) |
| `quick-notes/tsugumori-notes-c-console.html` | [Notes c console](../widgets/quick-notes/console/README.md) |
| `quick-notes/tsugumori-notes-d-ash.html` | [Notes d ash](../widgets/quick-notes/ash/README.md) |
| `quick-notes/tsugumori-notes-preview.html` | [Notes preview](../widgets/quick-notes/preview/README.md) |
| `quick-notes/tsugumori-notes-refined.html` | [Notes refined](../widgets/quick-notes/refined/README.md) |
