# Development and verification

Run commands from the repository root. `make -f /absolute/path/to/Chaldea/Makefile <target>` also works.

## Commands

| Command | Purpose |
| --- | --- |
| `make setup` | Check pinned Rust/Bun versions and install frozen frontend dependencies |
| `make dev` | Rebuild all local widgets, including drafts, and serve port 5175 |
| `make content` | Rebuild local content after editing widget sources |
| `make check` | Run units and code checks, package local and production content, and validate every widget |
| `make test` | Rerun only the small Rust and Bun unit suites |
| `make build` | Build production output in `dist/`, excluding drafts |
| `make preview` | Serve the production output on port 4173 |

Open `/` for the public Svelte site, `/?page=library` for the catalog, or `/?workbench` for the original backend preview UI. The workbench is available only in development and is not included in production bundles. Site code lives in `frontend/src/site/`; the shared generator and preview protocol keep their existing paths.

The library supports A–Z and Family sorting. `sort=family` selects Family; missing or unsupported sort values use A–Z.

There are no scope flags, per-widget test modes, browser test installations, fish simulations, or native test matrices. The former suites are available in Git history if a past investigation needs them.

## What the checks cover

`make test` exercises shared behavior with small synthetic fixtures: settings boundaries and typed QML placeholders, escaping and immutable generated results, complete assets, draft export restrictions, preview messages and runtime generation, folder discovery and the local source index, revisions, path confinement, publication ownership, draft omission, and preservation of existing output after a staging failure. Shared Rust/TypeScript contract cases live in `schemas/fixtures/`; they verify that both implementations agree. Generator tests cover boundary values for all five setting types without repeating them for every widget.

`make check` runs those units, Rust formatting and Clippy, a local content build, and one production build. Svelte diagnostics and TypeScript checking run during the production build. Rust is the only reader of widget sources and validates the entire library each time it packages. It writes `build/content/source-index.json` with the discovered IDs, source folders, and thumbnail mappings. The frontend library validator checks that the index and local catalog contain the same widgets, then inspects every packaged revision and checks:

- Classic preview JavaScript syntax without executing it, the shared runtime reference, and literal HTML `src`, `href`, `poster`, and CSS `url(...)` asset references.
- Valid setting definitions and defaults for every widget.
- One complete native export check per widget, using its default settings. The output must contain every declared file and preserve packaged asset bytes. Shared unit tests cover serialization and settings boundaries; the library scan checks each widget's templates and assets.
- Production notices, bundle identities, thumbnails, export assets, and the exact published widget set. Each production revision must equal the one checked locally. Draft files and the local source index must not appear in `dist/`.
- The SIL Open Font licenses for the site's self-hosted Faculty Glyphic and JetBrains Mono files, emitted under `dist/licenses/` by Vite.

The library validator has no widget-ID list to update. Add a valid `widget.json` in any supported category/study folder and it is checked on the next run. Errors identify the source folder or file. Unit tests remain independent of library size; the library scan grows with the files being checked.

These are static and data checks. They do not claim to verify visible layouts, clicks, animation quality, browser clipboard behavior, QML rendering, or desktop integrations. Inspect a changed preview at desktop and narrow widths in `make dev`, try its controls and export, and check native changes in an isolated Quickshell configuration before publishing them.

## CI and release builds

CI runs `make setup` followed by the same `make check`, then saves `dist/` as the release candidate. Pull requests and pushes to `main` are checked; ordinary branch pushes do not launch a second copy of a pull-request run. A newer run cancels a superseded run for the same ref. No browser is downloaded or launched.

Local and production content are separate. `build/content/` always holds every widget, drafts included, and its source index; `build/production/` holds the published set that Vite copies into `dist/`. The source index never enters production bundles or revision hashes. A running `make dev` keeps its drafts through a check. Do not run `make build` again after a successful check unless sources have changed.

No hosting provider is configured. A passing check creates a local candidate; it does not deploy the site. Follow `docs/publishing.md` for release and rollback requirements.

## Setup and stale output

Use the versions in `rust-toolchain.toml` and `.bun-version`. Make keeps Cargo and Bun caches under ignored `build/`. Dependency changes require an intentional `bun install` and review of `frontend/bun.lock`; normal installs use `bun install --frozen-lockfile`. Keep `backend/Cargo.lock` current too.

Never edit generated files under `build/` or `dist/`. Fix their sources and rebuild. Widget changes need `make content` and a reload; Vite watches application code but does not rebuild Rust content. The config is `chaldea.toml`. The packager writes a `.chaldea-content` ownership marker into its output. It refuses to overwrite a directory without that exact marker; inspect the path rather than adding a marker to bypass that protection. Output from before the project was renamed carries an older marker: delete that `build/` directory and rebuild.

## Fix a library error

Check the reported widget's `widget.json` first. IDs must be unique across the library. Each public/export file must exist inside its widget folder or the `_shared/` folder of a parent group, and mappings cannot overlap or use reserved paths. A `not found in this widget or a parent _shared folder` error names the widget folder and the declared source. New category and study folders cannot be empty or symlinked; a group holding only `_shared/` counts as empty. Moving source folders keeps the ID and URL; changing declared source bytes creates a new revision. Editing a file under `_shared/` gives every widget that uses it a new revision; a widget's own copy at the same path takes precedence.

A preview must load `../preview-runtime.js` from its HTML entry and register `window.ChaldeaPreview.connect`. Use classic scripts and declared local assets. Do not add `allow-same-origin` to work around a sandbox failure. The static checker resolves literal references; dynamically computed assets and behavior still need a manual preview check.

The shared preview runtime is generated from `frontend/src/preview/runtime-source.js` and `schemas/preview-host.schema.json`. After changing either, run `bun scripts/build-preview-runtime.ts` inside `frontend/`, then `make content`. Commit the generated `frontend/src/preview/runtime.js` with its sources. Unit checks reject stale generated bytes. `schemas/preview-controls.schema.json` defines the bounded control snapshots accepted by the sidebar. Try actions and appearance settings together when changing this protocol; actions must preserve the running scene and stay out of exported settings.

Quick Notes previews declare their preferred frame width with `data-preview-width` on the body, including outer padding. The runtime sends it with height updates, including width-only changes. The host bounds that width and lets the layout shrink on narrow screens. Settings that change widget width must update the body attribute too.

Template placeholders must be complete typed property values. Every native setting needs a binding. Published widgets require QML, nonempty exported instructions, and an exported license. An HTML-only design remains a draft with downloads disabled.

If the browser shows an old or removed widget, rebuild local content and reload. Removed widget sources remain in Git history; original import provenance is recorded in `docs/archive-imports.json`.

## Manual export inspection

The browser's Download file button saves only the selected output, including binary images and audio. Copy file is available for text files. Save every listed file, including README.md and LICENSE, and preserve its displayed path in your widget folder. Browsers download the final file name only; create any listed subfolders yourself, such as `sounds/` for Mechanical rhythm. Invalid settings disable both actions until corrected.

To create exact generated files without a browser, run this inside `frontend/`:

```sh
bun run export <widget-id> <new-output-directory> [settings.json]
```

The destination must not exist. Keep every file from the export together. Use Qt 6 tools to inspect native QML, and load the exported `shell.qml` in a separate test configuration rather than modifying live desktop files. Record the revision, environment, and limits when claiming native support.

Thumbnail capture still uses Playwright as an authoring tool through `scripts/thumbnails.ts`; it is not part of either check command. Browser binaries are only needed if you explicitly use that tool. Run `make content` after moving a widget or changing its thumbnail mapping so the local source index is current. From `frontend/`, `bun scripts/thumbnails.ts <preview-base-url> [widget-id-or-path ...]` accepts IDs and paths under `widgets/`, including an optional `widgets/` prefix. With no selectors it captures every local widget. Capture requires a declared WebP source and writes that source path inside the widget folder, even if the current file comes from `_shared/`. The writer checks filesystem metadata and rejects symlinked destination folders or files before creating directories or writing bytes. Run `make content` again to package the new image.

Blurry library cards usually indicate old 640 × 400 captures. The capture script now uses the card proportions from `frontend/src/site/catalog.ts`, waits for fonts and canvas rendering, and saves quality-95 WebP images at roughly 1320 or 2000 pixels wide. Tall lockscreen pages are fitted into the capture area so their login and footer remain visible. Regenerate the affected thumbnails and run `make content`; increasing an existing image's CSS size cannot restore its detail.

For an off-center capture or unwanted demo controls, inspect the widget's `frames` entry in `scripts/thumbnails.ts`. Console uses its notes section with 20 pixels of padding. Phase Lock uses its artwork section at a 1024-pixel viewport width so the full background and corner details fit the card. The capture expands around the selected element to match the card ratio, preserving the complete widget. Keep these adjustments in the capture script rather than changing the live preview's layout.

Live widget detail pages use natural preview sizes rather than thumbnail proportions or iframe scaling. The preview can grow up to 1200 pixels wide, and its authenticated body-height messages set the stage's height. If a preview is clipped after a settings change, check that it sends an updated `resize` message; do not restore a fixed stage height or shrink the iframe. Compact widgets can report a preferred width, which is capped by the available space on mobile.

The unfiltered A–Z library uses masonry placement and individual card proportions. Family filters, search results, and Family sorting use rows in the selected order, with each row starting at the left. Every card uses one column, and cards in the same family have equal dimensions. Family plate ratios live in `site/catalog.ts`: Glyphs 7:10, Art and Player 8:5, Lockscreens 1:1, and Notes 9:10. Art and Player filters use fewer, wider columns. Thumbnails fit inside their plates without additional cropping. Position, width, and plate proportions transition together when filters change.

Entering the library through a link from another page uses a 620 ms green wipe through the browser's View Transitions API. Family, sort, and search changes keep their card transitions. Reduced motion and browsers without the API navigate immediately. Browser Back and Forward also update immediately so native scroll restoration can use the destination layout. The animated route update waits for Svelte's layout, and newer navigation cancels an unfinished wipe so a delayed callback cannot restore an old route.

## Distribution notices

The application uses Apache 2.0; original widgets use 0BSD. Builds emit `LICENSE.txt`, `NOTICE.txt`, and `THIRD_PARTY_LICENSES.txt`. Keep them with the distributed site. Each widget's output file list includes its applicable license; save it with the other files.

## Family notes

Each family with native exports keeps its component, shared-file, and inspection notes beside its sources: [Quick notes](../widgets/quick-notes/README.md), [Player](../widgets/player/README.md), [Glyphs](../widgets/glyphs/README.md), [Interactive art](../widgets/interactive-art/README.md), and [Lockscreens](../widgets/lockscreens/README.md). Lockscreen exports are visual components with demo interactions; the preview launcher does not authenticate or lock the session.
