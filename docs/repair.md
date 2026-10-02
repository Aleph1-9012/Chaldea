# Development and verification

Run commands from the repository root. `make -f /absolute/path/to/Chaldea/Makefile <target>` also works.

## Commands

| Command | Purpose |
| --- | --- |
| `make setup` | Check pinned Rust/Bun versions and install frozen frontend dependencies |
| `make dev` | Rebuild all local widgets, including drafts, and serve port 5175 |
| `make content` | Rebuild local content after editing widget sources |
| `make check` | Run units and code checks, build production once, and validate every widget |
| `make test` | Rerun only the small Rust and Bun unit suites |
| `make build` | Build production output in `dist/`, excluding drafts |
| `make preview` | Serve the production output on port 4173 |

There are no scope flags, per-widget test modes, browser test installations, fish simulations, or native test matrices. The former suites are available in Git history if a past investigation needs them.

## What the checks cover

`make test` exercises shared behavior with small synthetic fixtures: settings and typed QML placeholders, escaping and immutable generated results, complete assets, draft export restrictions, folder discovery, revisions, path confinement, publication ownership, draft omission, and recovery after packaging failure. Shared Rust/TypeScript contract cases live in `schemas/fixtures/`; they verify that both implementations agree.

`make check` runs those units, Rust formatting and Clippy, and one production build. TypeScript checking happens once during that build. Rust validates the entire source library once while packaging production. The frontend library validator then discovers all widget definitions automatically and checks:

- Classic preview JavaScript syntax without executing it, the shared runtime reference, and literal HTML `src`, `href`, `poster`, and CSS `url(...)` asset references.
- Valid default and boundary settings for every widget.
- Generated QML and complete ZIP contents for each widget with native exports, using default, low, and high settings.
- Production notices, bundle identities, thumbnails, export assets, and the exact published widget set. Draft files must not appear in `dist/`.

The library validator has no widget-ID list to update. Add a valid `widget.json` in any supported category/study folder and it is checked on the next run. Errors identify the source folder or file. Unit tests remain independent of library size; the library scan grows with the files being checked.

These are static and data checks. They do not claim to verify visible layouts, clicks, animation quality, browser clipboard behavior, QML rendering, or desktop integrations. Inspect a changed preview at desktop and narrow widths in `make dev`, try its controls and export, and check native changes in an isolated Quickshell configuration before publishing them.

## CI and release builds

CI runs `make setup` followed by the same `make check`, then saves `dist/` as the release candidate. Pull requests and pushes to `main` are checked; ordinary branch pushes do not launch a second copy of a pull-request run. A newer run cancels a superseded run for the same ref. No browser is downloaded or launched.

The check builds production, so `build/content/` contains only published entries afterward. Run `make content` or `make dev` to restore drafts for local browsing. Do not run `make build` again after a successful check unless sources have changed.

No hosting provider is configured. A passing check creates a local candidate; it does not deploy the site. Follow `docs/publishing.md` for release and rollback requirements.

## Setup and stale output

Use the versions in `rust-toolchain.toml` and `.bun-version`. Make keeps Cargo and Bun caches under ignored `build/`. Dependency changes require an intentional `bun install` and review of `frontend/bun.lock`; normal installs use `bun install --frozen-lockfile`. Keep `backend/Cargo.lock` current too.

Never edit generated files under `build/` or `dist/`. Fix their sources and rebuild. Widget changes need `make content` and a reload; Vite watches application code but does not rebuild Rust content. The config is `chaldea.toml`. The packager recognizes its former ownership marker only to migrate old output and writes `.chaldea-content` for current output. It refuses to overwrite an unowned directory; inspect the path rather than adding a marker to bypass that protection.

## Fix a library error

Check the reported widget's `widget.json` first. IDs must be unique across the library. Each public/export file must exist inside its widget folder, and mappings cannot overlap or use reserved paths. New category and study folders cannot be empty or symlinked. Moving source folders keeps the ID and URL; changing declared source bytes creates a new revision.

A preview must load `../preview-runtime.js` from its HTML entry and register `window.ChaldeaPreview.connect`. Use classic scripts and declared local assets. Do not add `allow-same-origin` to work around a sandbox failure. The static checker resolves literal references; dynamically computed assets and behavior still need a manual preview check.

Template placeholders must be complete typed property values. Every native setting needs a binding. Published widgets require QML, nonempty exported instructions, and an exported license. An HTML-only design remains a draft with downloads disabled.

If the browser shows an old or removed widget, rebuild local content and reload. Removed widget sources remain in Git history; original import provenance is recorded in `docs/archive-imports.json`.

## Manual export inspection

To create exact generated files without a browser, run this inside `frontend/`:

```sh
bun run export <widget-id> <new-output-directory> [settings.json]
```

The destination must not exist. Keep every file from the export together. Use Qt 6 tools to inspect native QML, and load the exported `shell.qml` in a separate test configuration rather than modifying live desktop files. Record the revision, environment, and limits when claiming native support.

Thumbnail capture still uses Playwright as an authoring tool through `scripts/thumbnails.ts`; it is not part of either check command. Browser binaries are only needed if you explicitly use that tool.

## Distribution notices

The application uses Apache 2.0; original widgets use 0BSD. Builds emit `LICENSE.txt`, `NOTICE.txt`, and `THIRD_PARTY_LICENSES.txt`. Keep them with the distributed site. Widget ZIP files include their own applicable licenses.
