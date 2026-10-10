# Architecture

Chaldea has one Cargo package and one Bun-managed Svelte 5 application, compiled with Vite. Rust runs at build time. Visitors receive static files and run the QML generator locally.

The public interface lives in `frontend/src/site/`. The original vanilla interface remains a development-only workbench at `/?workbench`; Vite removes that branch from production. The two interfaces share the catalog boundary, settings validator, QML generator, and sandboxed preview host. The public site uses Svelte transitions and CSS motion, with reduced-motion alternatives. Fonts and Figma artwork are served locally.

The design source is the [Chaldea-Final page](https://www.figma.com/design/KXkwFASGkZUsJM7hXaNLRa/chaldea-astra?node-id=351-368), supported by [Chaldea Components](https://www.figma.com/design/KXkwFASGkZUsJM7hXaNLRa/chaldea-astra?node-id=585-2). `site/assets/` contains the exported artwork; numeral masks apply the screen's palette to the original outlines. `site/catalog.ts` records the approved card names and plate proportions. Counts, settings, thumbnails, and exports come from packaged content. Future entries use their catalog title and a 16:10 plate until their presentation is specified.

## Content and revisions

`chaldea.toml` supplies format versions, widget license defaults, the native baseline, and shared inputs. Rust discovers `widget.json` recursively under category and study folders in `widgets/`, resolves defaults, validates the shared schemas and semantic constraints, then reads only declared files. Discovery stops at each widget folder, rejects symlink groups, and checks IDs for global uniqueness. Source folder names are independent of stable public IDs and do not enter revision hashes. Individual inputs are limited to 8 MiB.

A declared source resolves in its widget folder first, then in the `_shared/` folder of each parent group, nearest first. The canonical path must stay inside the folder that supplied it. Hashes use the declared source name and its bytes, so moving an identical file between a widget and `_shared/` leaves revisions unchanged. Rust is the only reader of widget sources; the frontend scripts inspect what it packaged.

The packager writes a complete staging directory before replacing its prior generated output. It refuses unowned output directories and source overlaps. A failed content validation leaves the previous output intact. Output must contain the `.chaldea-content` ownership marker with its exact contents.

`catalog.json` contains summaries, setting counts, and URLs. A selected revision contains its definition, templates, usage text, export manifest, preview, thumbnail, and assets. Revision IDs are SHA-256 hashes of the resolved definition, declared bytes, project config, shared schemas, runtime, and generator inputs. Changing those inputs changes the URL. Unlisted source files are neither hashed nor copied.

`make content` packages every widget, drafts included, into `build/content/` for development and checks. `make build` packages only published widgets into `build/production/`, which Vite copies into `dist/`. Each assembly starts from clean staging and keeps only the current revisions. The publishing host must retain old public revision URLs separately; a local `dist/` directory is not that retention mechanism.

Local packaging also writes `source-index.json` from Rust's discovery results. The shared `schemas/source-index.schema.json` contract records the configured source root and each widget's ID, relative folder, and declared thumbnail source. Frontend authoring scripts read this index and packaged revisions without reading widget definitions or source file contents. Thumbnail capture checks destination metadata, then writes the declared source path inside the selected widget folder, creating a local override when the packaged thumbnail came from `_shared/`. The index stays outside revision bundles and hashes, and production packaging omits it.

The `chaldea-bundle-v1` salt in `backend/src/build.rs` represents packaging semantics. Change it when packaging behavior changes the bytes or interpretation without changing another hashed input. Keep `shared_inputs` current if generator dependencies move or grow.

## Browser state

The browser validates the catalog and selected bundle with the same schema documents Rust uses. Shared fixtures exercise semantic rules beyond JSON Schema. Definitions own defaults and limits; UI code has no widget-specific settings registry.

For each edit to a native widget's appearance settings, the app validates proposed values and synchronously generates every file. It then gives the accepted snapshot to the code panel and its settings to the preview. Copy and Download file use the selected file from that collection. Text can be copied or downloaded; binary assets can be downloaded byte for byte. An invalid edit disables export and clears visible stale code until the input is corrected or reset. Draft previews receive validated settings without generating exports. Async widget loads use abort signals and request counters.

The pure generator in `frontend/src/generator/index.ts` imports no browser, storage, or network APIs. Templates accept placeholders only as complete typed QML property values. Strings use JSON escaping, numbers must be finite and within declared bounds, and enum values must be declared. Replacement happens once, so placeholder-looking user text stays literal. Static and binary exports are copied byte for byte.

The homepage opens at `/`; `?page=library` opens the library. Family, sort, and search use `family`, `sort`, and `q` query parameters. Selection uses `?widget=<id>`. Settings never enter the URL or persistent storage. Catalog summaries and thumbnails load first; full bundles and export assets load on selection.

## Preview isolation

Preview engines run inside the iframe. Interactive art exposes its live controls, pause state, status, and in-memory collections in the customization sidebar through schema-validated messages. The sidebar sends actions back to the same engine; those actions never enter appearance settings or exported files. Canvas gestures remain inside the artwork. Standalone previews retain their own controls, and embedded previews hide them only after the sidebar acknowledges a valid control snapshot.

The runtime reports body height through the authenticated channel, and the parent bounds the frame height between 300 and 4096 pixels. The public site renders previews at their natural CSS size, up to 1200 pixels wide, and lets the stage grow with their content. A preview's preferred width is respected within the available space, and narrow screens use the preview's responsive layout. Tall widgets extend the page instead of being scaled down into a fixed-height panel. The development workbench retains its existing family layouts. Only one iframe runs at a time. It has `sandbox="allow-scripts allow-downloads"` without `allow-same-origin`, and a no-referrer policy. The parent checks the exact frame window, channel, per-instance random token, and message sequence. The shared runtime accepts settings and actions only from its parent after the handshake, rejects stale actions, and checks each action against the current control limits. Switching widgets removes the old frame, message listener, and timeout.

`schemas/preview-host.schema.json` defines parent messages. The runtime generator embeds its AJV validator into a classic script for opaque frames. `schemas/preview-controls.schema.json` defines snapshots received by the app. Snapshot acknowledgments keep live updates from overwriting pending edits; keyed sidebar controls preserve focus and text selection. Focus requests carry their action sequence so an earlier action cannot interrupt a later edit. Previews can advertise an Escape action to retain that shortcut while sidebar controls have focus.

A six-second load/render timeout replaces the frame with a thumbnail. Independently valid QML stays available. Previews are owner-maintained browser demonstrations; their animation does not establish native integration. Creator uploads would require a separate credential-free preview origin and additional review and resource controls.

## Launch boundaries

The library has no backend server, user accounts, creator uploads, saved visitor state, telemetry, or remote fonts. All declared widget files and applicable licenses are available individually in the output selector. Native behavior is verified separately in isolated Quickshell configurations.

An account API, private storage, authentication, preset migrations, and server-side permissions remain deferred. If needed later, start with an API executable in the existing Rust package. Anonymous browsing, customization, and export must continue independently.

## Content scope

Only owner-requested designs belong in `widgets/`. [The inventory](widget-inventory.md) lists every entry and its native family. All current entries have native exports. Each imported design has its own definition and preview document. Palettes and appearance controls remain settings. The full archive source map is in `docs/archive-imports.json`. Existing entries and their IDs remain stable. [The roadmap](roadmap.md) records what is added next.

The AFK, Editorial, Print, and Reactive lockscreen previews declare the `support.js` adapter in `widgets/_shared/preview/` for the source pages' optional tuning controls and inline SVG icons. The adapter connects appearance settings through `ChaldeaPreview.connect`; it runs inside the same opaque iframe and requests no external assets. Multi-design selectors are fixed to the chosen design and removed. Some source scripts share hidden supporting DOM; those panels are inert and omitted from display. Notes, media, lockscreen, and desktop actions use local sample state. Validation and export tests use an internal contract fixture outside the catalog.

Each family with native exports documents its components, shared files, and inspection notes beside its sources: [Quick notes](../widgets/quick-notes/README.md), [Player](../widgets/player/README.md), [Glyphs](../widgets/glyphs/README.md), [Interactive art](../widgets/interactive-art/README.md), and [Lockscreens](../widgets/lockscreens/README.md). Each output list includes the design, helper files, launcher, instructions, and license. Save them with their declared names and folder paths.
