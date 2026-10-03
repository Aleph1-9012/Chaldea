# Architecture

Chaldea has one Cargo package and one Bun-managed frontend application. Rust runs at build time. Visitors receive static files and run the QML generator locally.

## Content and revisions

`chaldea.toml` supplies format versions, widget license defaults, the native baseline, and shared inputs. Rust discovers `widget.json` recursively under category and study folders in `widgets/`, resolves defaults, validates the shared schemas and semantic constraints, then reads only declared files. Discovery stops at each widget folder, rejects symlink groups, and checks IDs for global uniqueness. Source folder names are independent of stable public IDs and do not enter revision hashes. Individual inputs are limited to 8 MiB.

A declared source resolves in its widget folder first, then in the `_shared/` folder of each parent group, nearest first. The canonical path must stay inside the folder that supplied it. Hashes use the declared source name and its bytes, so moving an identical file between a widget and `_shared/` leaves revisions unchanged. Rust is the only reader of widget sources; the frontend scripts inspect what it packaged.

The packager writes a complete staging directory before replacing its prior generated output. It refuses unowned output directories and source overlaps. A failed content validation leaves the previous output intact. Output must contain the `.chaldea-content` ownership marker with its exact contents.

`catalog.json` contains summaries and URLs. A selected revision contains its definition, templates, usage text, export manifest, preview, thumbnail, and assets. Revision IDs are SHA-256 hashes of the resolved definition, declared bytes, project config, shared schemas, runtime, and generator inputs. Changing those inputs changes the URL. Unlisted source files are neither hashed nor copied.

`make content` packages every widget, drafts included, into `build/content/` for development and checks. `make build` packages only published widgets into `build/production/`, which Vite copies into `dist/`. Each assembly starts from clean staging and keeps only the current revisions. The publishing host must retain old public revision URLs separately; a local `dist/` directory is not that retention mechanism.

Local packaging also writes `source-index.json` from Rust's discovery results. The shared `schemas/source-index.schema.json` contract records the configured source root and each widget's ID, relative folder, and declared thumbnail source. Frontend authoring scripts read this index and packaged revisions without reading `widgets/`. Thumbnail capture writes the declared source path inside the selected widget folder, creating a local override when the packaged thumbnail came from `_shared/`. The index stays outside revision bundles and hashes, and production packaging omits it.

The `chaldea-bundle-v1` salt in `backend/src/build.rs` represents packaging semantics. Change it when packaging behavior changes the bytes or interpretation without changing another hashed input. Keep `shared_inputs` current if generator dependencies move or grow.

## Browser state

The browser validates the catalog and selected bundle with the same schema documents Rust uses. Shared fixtures exercise semantic rules beyond JSON Schema. Definitions own defaults and limits; UI code has no widget-specific settings registry.

For each edit, the app validates proposed values and synchronously generates every file. It then gives the accepted snapshot to the code panel and its settings to the preview. Copy and ZIP use that file collection. An invalid edit disables export and clears visible stale code until the input is corrected or reset. Async widget loads use abort signals and request counters.

The pure generator in `frontend/src/generator/index.ts` imports no browser, storage, or network APIs. Templates accept placeholders only as complete typed QML property values. Strings use JSON escaping, numbers must be finite and within declared bounds, and enum values must be declared. Replacement happens once, so placeholder-looking user text stays literal. Static and binary exports are copied byte for byte.

Selection uses `?widget=<id>`. Settings never enter the URL or persistent storage. Catalog summaries and thumbnails load first; full bundles and export assets load on selection.

## Preview isolation

Existing preview controls run inside the iframe. The runtime reports body height through the authenticated channel, and the parent bounds the frame height between 300 and 4096 pixels to fit interactive previews on narrow screens. HTML drafts use the full content width, with any tuning settings below them. Only one iframe runs at a time. It has `sandbox="allow-scripts allow-downloads"` without `allow-same-origin`, and a no-referrer policy. The parent checks the exact frame window, channel, per-instance random token, and message sequence. The shared runtime accepts settings only from its parent after the handshake. Switching widgets removes the old frame, message listener, and timeout.

A six-second load/render timeout replaces the frame with a thumbnail. Independently valid QML stays available. Previews are owner-maintained browser demonstrations; their animation does not establish native integration. Creator uploads would require a separate credential-free preview origin and additional review and resource controls.

## Launch boundaries

The library has no backend server, user accounts, creator uploads, saved visitor state, telemetry, or remote fonts. Downloads include all declared widget assets and applicable licenses. Native behavior is verified separately in isolated Quickshell configurations.

An account API, private storage, authentication, preset migrations, and server-side permissions remain deferred. If needed later, start with an API executable in the existing Rust package. Anonymous browsing, customization, and export must continue independently.

## Content scope

Only owner-requested designs belong in `widgets/`. [The inventory](widget-inventory.md) lists every entry and which have native exports; the rest are HTML drafts. Each imported design has its own definition and preview document. Palettes and appearance controls remain settings. The full archive source map is in `docs/archive-imports.json`. Existing entries and their IDs remain stable. [The roadmap](roadmap.md) records what is added next.

Most archive previews declare the `support.js` adapter in `widgets/_shared/preview/` for the source pages’ optional tuning controls and inline SVG icons. The adapter connects each control to `ChaldeaPreview.connect`; it runs inside the same opaque iframe and requests no external assets. Multi-design selectors are fixed to the chosen design and removed. Some source scripts share hidden supporting DOM; those panels are inert and omitted from display. Notes, clipboard, media, lockscreen, and desktop actions use local sample state. Validation and export tests use an internal contract fixture outside the catalog.

Each family with native exports documents its components, shared files, and inspection notes beside its sources: [Quick notes](../widgets/quick-notes/README.md), [Player](../widgets/player/README.md), [Glyphs](../widgets/glyphs/README.md), and [Interactive art](../widgets/interactive-art/README.md). Every ZIP contains its own design, helper files, launcher, instructions, and license.
