# Repair and verification

Run the canonical commands from the repository root. `make -f /absolute/path/to/XLR8/Makefile <target>` also works; content paths are explicit.

## Setup and stale output

`make setup` requires the exact Rust and Bun versions in the root pin files, Rust formatting/lint components, and a working native compiler. It installs with the frozen Bun lockfile. After an intentional dependency change, run `bun install` inside `frontend/`, review `bun.lock`, and keep it with `package.json`. Use locked Cargo commands and keep `backend/Cargo.lock` too.

Make keeps Cargo and Bun caches under ignored `build/`. Install the pinned Bun version on `PATH`. A fresh checkout needs no files from `build/`.

If a preview reflects old widget source, run `make content` and reload. Vite watches application source; it does not rebuild Rust content. A production build removes local drafts from `build/content/`. Run `make content` again to restore them for development.

Never patch a revision under `build/` or `dist/`. Fix its declared source and rebuild. Rust prepares content in staging and replaces only output bearing its ownership marker. If it refuses an unowned output directory, inspect that path before choosing a new output location. Do not add a marker to bypass that protection.

## Find a content error

Rust errors report a source path, field, and cause. Check `widget.json` first for invalid defaults, duplicate setting keys, missing mappings, reserved output names, or folder/ID mismatch. Each referenced path must resolve inside its widget folder. Files over 8 MiB are rejected.

A template placeholder must be the complete typed property value on its line. Unknown or unused settings, mismatched property types, and empty templates fail validation. Published widgets require QML, nonempty exported usage, and a `LICENSE` export. Mark unfinished content draft rather than weakening those checks.

## Browser problems

`make check` starts Vite when port 5175 is free and uses a separate Chromium context per test. Stop an unrelated server on that port before testing. Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to select a browser, or install Playwright Chromium with `bunx --bun playwright install --with-deps chromium` in `frontend/`. On Linux containers, browser/server execution may need a less restricted sandbox.

The production catalog contains the seven native Quick notes widgets. Use `make dev` for all 245 designs, including 238 HTML drafts. See `docs/widget-inventory.md` for available widgets and `docs/archive-imports.json` for source provenance.

Clipboard flow and Clipboard rice fit operate on sample history inside their previews. Use entry, Paste, and restore messages do not access the system clipboard. Reloading resets the sample entries. If search or the pinned filter hides everything, clear that filter to see the remaining entries. Rice fit's Undo restores its last deleted sample; Flow's deletions reset on reload.

Look in the browser console for failed catalog or bundle requests. Query-based selection should reload on an ordinary static server. A revision mismatch, malformed definition, or missing export asset fails closed. Invalid inputs disable Copy and Download until corrected; Reset restores the declared defaults.

A preview timeout displays its thumbnail after six seconds. Confirm its HTML loads `../preview-runtime.js` before `demo.js` or its adapter, and that the script registers a callback. Do not fix sandbox errors by adding `allow-same-origin`. Preview failure does not disable independently valid QML. The preview host accepts authenticated height updates up to 4096 pixels to make the entire study reachable. If controls appear clipped, check that the shared runtime has loaded and that its resize messages are accepted. Browser evidence lives under `build/evidence/`.

If an old study has missing icons or tries to load Google Fonts, fix its source wrapper. The imported studies use inline icons and system fonts. Reduced motion starts the art studies paused; their controls still work.

After `make build`, run `bun scripts/check-dist.ts` from `frontend/`. This serves the actual `dist/` files under `/library/` and checks license notices, draft omission, and all seven Quick notes entries, including selection, reloads, preview, and code. It does not deploy anything.

## Native problems

The seven Quick notes widgets support native checks. For example, run `make native-check WIDGET=notes-notes-refined`. The other 238 entries remain HTML drafts; do not create a widget just to make this command pass.

Extract the entire Quick notes ZIP before running `qs -p /absolute/path/to/shell.qml`. Missing helper files cause QML type errors. Share Tech Mono and Inter are optional system fonts; Qt falls back to installed fonts. Notes belong to the component instance and are lost when it is destroyed. Collapse/reopen preserves them. Refined’s Undo restores deleted notes in reverse order. No settings or notes are written to disk.

Run `make native-check WIDGET=<id>`. Use Qt 6 tools, not similarly named Qt 5 binaries. The helper prefers `/usr/lib/qt6/bin/qmllint` and `/usr/lib/qt6/bin/qmltestrunner`. Override paths with `QMLLINT`, `QMLTESTRUNNER`, and `QUICKSHELL` if needed.

Each run creates a unique directory under `build/native/`, with exact generated files, rendered images, and logs. The helper uses an isolated temporary runtime directory, offscreen software rendering, and no live Wayland/X11 display. Quickshell needs local IPC, which some execution sandboxes block. A sandbox failure is not a passing native check.

Lint proves syntax and import checks. QtTest exercises properties, rendering, and supplied behavior cases. Quickshell loading proves the example configuration starts. None proves compositor placement, audio integration, sleep inhibition, or authentication. Test actual integrations in an appropriate isolated session before claiming support.

After widget/QML or generator output changes, repeat relevant native checks. Keep the generated revision, tool versions, logs, and limitations with your release notes before removing ignored evidence.

## Publication and rollback

No hosting provider is configured yet. `make build` creates a candidate release only. Follow `docs/publishing.md` when choosing a host and adding deployment.

Upload complete immutable revisions before activating their catalog. Keep prior revision URLs reachable and retain the previous website/catalog artifact. Roll back by restoring that complete previous artifact while retaining both generations of revision files. Verify old open tabs, fresh loads, customization, Copy, and ZIP. Clearing or replacing a revisions directory is not a rollback strategy.

## Quick notes appearance

The three custom color pickers apply when Palette is Custom. Switching to a preset keeps those custom values available; Reset restores the original palette and square, 1 px frames. The original shapes and frame widths are fixed. Reset and appearance edits preserve current notes. After editing a notes preview, template, or helper, rebuild with `make content`. Browser checks cover all palette presets, custom colors, note preservation, and matching Copy/ZIP output; native checks exercise the same settings on rendered components.

All seven Quick notes widgets provide writing-area height, title size, list spacing, optional word/character counts, note-number visibility, and Top/Bottom placement for new notes. Visible note rows sets the scrolling list height from two to eight rows. Ash counts collapsed cards and adds room for the active editor. Index keeps its row-height setting; list spacing adjusts that base height. Console's original Spacing setting controls frame padding independently of writing-area height.

Reset preserves notes and selection and restores each design's defaults: four visible rows, Top insertion for Ash and Bottom elsewhere, and numbers hidden for Cassette. Refined also preserves its Undo history, including the positions of pending deletions after adding at the top.

The notes previews connect directly to the shared preview runtime. `preview/options.js` handles the six other widgets' shared reading controls; Refined keeps its row-preserving selection and Undo handling in `preview/demo.js`. Each widget remains self-contained. Update all affected copies when changing shared helpers, and rebuild with `make content`.

If changing list spacing or height hides the active native note, check `NoteList.qml` or Ash's `NotesStack.qml`: selection positioning must run after list layout. Character counts treat a Unicode surrogate pair as one code point in both preview and QML. Run the Quick notes browser cases and `make native-check WIDGET=<id>` for each affected widget after changing either behavior. Native checks use exact generated bundles in isolated directories.

## Distribution notices

The application uses Apache 2.0; original widgets use 0BSD. `make build` emits the root license as `LICENSE.txt`, the project notice as `NOTICE.txt`, and dependency notices as `THIRD_PARTY_LICENSES.txt`. Keep all three with a distributed site. Widget downloads carry their own licenses. If package metadata or the UI disagrees, check `docs/licensing.md`, `frontend/package.json`, `backend/Cargo.toml`, and the application's license label.
