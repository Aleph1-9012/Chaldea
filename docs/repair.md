# Repair and verification

Run the canonical commands from the repository root. `make -f /absolute/path/to/Chaldea/Makefile <target>` also works; content paths are explicit.

## Setup and stale output

`make setup` requires the exact Rust and Bun versions in the root pin files, Rust formatting/lint components, and a working native compiler. It installs with the frozen Bun lockfile. After an intentional dependency change, run `bun install` inside `frontend/`, review `bun.lock`, and keep it with `package.json`. Use locked Cargo commands and keep `backend/Cargo.lock` too.

Make keeps Cargo and Bun caches under ignored `build/`. Install the pinned Bun version on `PATH`. A fresh checkout needs no files from `build/`.

If a preview reflects old widget source, run `make content` and reload. Vite watches application source; it does not rebuild Rust content. A production build removes local drafts from `build/content/`. Run `make content` again to restore them for development.

Never patch a revision under `build/` or `dist/`. Fix its declared source and rebuild. Rust prepares content in staging and replaces only output bearing its ownership marker. If it refuses an unowned output directory, inspect that path before choosing a new output location. Do not add a marker to bypass that protection.

The project config is `chaldea.toml`, the Rust package and CLI are `chaldea`, and the frontend package is `chaldea-frontend`. Rebuild with `make content` or `make build` after updating an existing checkout. The packager recognizes the former ownership marker solely to migrate generated output and writes only `.chaldea-content`. Preview adapters use `window.ChaldeaPreview` and the `chaldea:preview` channel. Rebuilt revisions include this runtime change; widget IDs and selection URLs stay the same. Reload any open development tabs after rebuilding.

## Development commands

| Command | Result |
| --- | --- |
| `make setup` | Check prerequisites and install frozen dependencies |
| `make content` | Validate and package content, including drafts |
| `make dev` | Build development content and start Vite on port 5175 |
| `make check` | Run Rust, content, TypeScript, unit, and Chromium browser checks |
| `make build` | Build the static site in `dist/`, excluding drafts |
| `make preview` | Serve the production build on port 4173 |
| `make native-check WIDGET=<id>` | Export, lint, render, and exercise a native widget in isolation |

## Keep the preview server running

A server started inside an automation session can stop when that session ends. On Linux with a systemd user session, run this from the repository root to keep the server independent of the launching terminal. Stop any existing preview on port 5175 first.

```sh
systemd-run --user --unit=chaldea-dev --collect --service-type=exec \
  --working-directory="$PWD" --setenv="PATH=$PATH" \
  --property=Restart=on-failure --property=RestartSec=2s make dev
```

This transient service restarts after a failure and stays available during the user session. It is not enabled at boot. Open `http://127.0.0.1:5175/` once Vite starts. Use `systemctl --user status chaldea-dev` to inspect it, `journalctl --user -u chaldea-dev -n 50` for logs, and `systemctl --user stop chaldea-dev` to stop it. Widget-source changes still require `make content` and a page reload.

## Find a content error

Rust errors report a source path, field, and cause. Check `widget.json` first for invalid defaults, duplicate widget IDs or setting keys, missing mappings, or reserved output names. Each referenced path must resolve inside its widget folder. Files over 8 MiB are rejected. Category and study folders cannot contain symlinks or empty groups. Discovery stops at `widget.json`, so a widget must not contain another widget. Source folder names may differ from IDs; moving a folder preserves its public URL and revision when file contents stay the same.

## Focused checks

`make check` remains the complete pre-merge suite used by CI. It runs Rust formatting, Clippy and tests, TypeScript, all unit tests, content packaging, and all browser tests. Content packaging validates the catalog once; the full check no longer runs a separate duplicate content validation first.

Use these narrower commands during edits:

| Command | Scope |
| --- | --- |
| `make check SCOPE=core` | Rust, TypeScript, schema/generator and source-lookup tests, and content validation. No browsers, fish simulation, or content rebuild. |
| `make check WIDGET=glyphs/branch-grammar` | Rebuild content, then run only this widget's browser tests. |
| `make check GROUP=glyphs` | Rebuild content, then run browser tests for all six glyphs. |
| `make check GROUP=lockscreens/layouts` | Run the browser checks for that study folder. |
| `make check WIDGET=interactive-art/fish-in-space` | Rebuild content, then run fish motion unit tests and its browser checks. |
| `make native-check WIDGET=quick-notes/refined` | Export and check native QML in isolation. |

`WIDGET` accepts an existing public ID or a path relative to `widgets/`. `GROUP` accepts a category or study path. Unknown selectors fail before rebuilding; `WIDGET` and `GROUP` cannot be combined. Archive tests filter entries before batching, so a focused run does not open unrelated archive previews. Other widgets still undergo content validation during the rebuild. Use `SCOPE=core` as well when changing shared application code, and the full check before merging. Native checks remain separate and are required when QML or generated output changes.

The fish unit suite still simulates every original frame and edge case. It accumulates minimum clearances and maximum movement errors, then asserts those bounds once per scenario rather than asserting at every frame. This reduces assertion overhead without sampling fewer frames.

A template placeholder must be the complete typed property value on its line. Unknown or unused settings, mismatched property types, and empty templates fail validation. Published widgets require QML, nonempty exported usage, and a `LICENSE` export. Mark unfinished content draft rather than weakening those checks.

## Browser problems

Browser checks start their own Vite server on an available localhost port and close it after the suite. They never reuse or stop the development server on port 5175. Each test still gets a separate Chromium context. Setup has a 60-second timeout, including Chromium's 30-second launch deadline; individual tests keep their 25-second timeout. Setup logs report server and browser readiness so a startup failure identifies the stalled stage.

CI uses the Chromium installed by Playwright. Locally, `/usr/bin/chromium` is used when available; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` explicitly overrides either choice. Install Playwright Chromium with `bunx --bun playwright install --with-deps chromium` in `frontend/`. On Linux containers, browser/server execution may need a less restricted sandbox.

Anamorphic 704, Kinetic typography, Kirigami panel, Pachinko gutter, and Notes numbered have been removed. Their previous widget URLs now show "Widget not found".

The Player section contains only Player directions. The other Player entries were removed at the owner's request; their previous URLs also show "Widget not found". Their source provenance remains in `docs/archive-imports.json` as excluded sources.

The Control center and Menu sections have been removed along with their widgets. They no longer appear in category navigation, and their former widget URLs show "Widget not found". The import manifest retains their original source provenance as excluded sources.

The production catalog contains the six native Quick notes widgets. Use `make dev` for all 162 designs, including 156 HTML drafts. See `docs/widget-inventory.md` for available widgets and `docs/archive-imports.json` for source provenance.

Clipboard flow and Clipboard rice fit operate on sample history inside their previews. Use entry, Paste, and restore messages do not access the system clipboard. Reloading resets the sample entries. If search or the pinned filter hides everything, clear that filter to see the remaining entries. Rice fit's Undo restores its last deleted sample; Flow's deletions reset on reload.

The six Glyphs previews contain only the artwork and demo input panel, including User, Unlock, and the session line. Typing changes the artwork, deleting text restores its earlier state, and Enter or Unlock runs the preview curtain. Clocks, branding, power dialogs, and the background grid have been removed from these six entries. Glyph Bay no longer declares a Background grid setting. These remain HTML drafts with export disabled. After editing them, run `make content` and reload.

Look in the browser console for failed catalog or bundle requests. Query-based selection should reload on an ordinary static server. A revision mismatch, malformed definition, or missing export asset fails closed. Invalid inputs disable Copy and Download until corrected; Reset restores the declared defaults.

A preview timeout displays its thumbnail after six seconds. Confirm its HTML loads `../preview-runtime.js` before `demo.js` or its adapter, and that the script registers a callback. Do not fix sandbox errors by adding `allow-same-origin`. Preview failure does not disable independently valid QML. The preview host accepts authenticated height updates up to 4096 pixels to make the entire study reachable. If controls appear clipped, check that the shared runtime has loaded and that its resize messages are accepted. Browser evidence lives under `build/evidence/`.

If an old study has missing icons or tries to load Google Fonts, fix its source wrapper. The imported studies use inline icons and system fonts. Reduced motion starts the art studies paused; their controls still work.

After `make build`, run `bun scripts/check-dist.ts` from `frontend/`. This serves the actual `dist/` files under `/library/` and checks license notices, draft omission, and all six Quick notes entries, including selection, reloads, preview, and code. It does not deploy anything.

## Native problems

The six Quick notes widgets support native checks. For example, run `make native-check WIDGET=notes-notes-refined`. The other 156 entries remain HTML drafts; do not create a widget just to make this command pass.

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

All six Quick notes widgets provide writing-area height, title size, list spacing, optional word/character counts, note-number visibility, and Top/Bottom placement for new notes. Visible note rows sets the scrolling list height from two to eight rows. Ash counts collapsed cards and adds room for the active editor. Index keeps its row-height setting; list spacing adjusts that base height. Console's original Spacing setting controls frame padding independently of writing-area height.

Reset preserves notes and selection and restores each design's defaults: four visible rows, Top insertion for Ash and Bottom elsewhere, and numbers hidden for Cassette. Refined also preserves its Undo history, including the positions of pending deletions after adding at the top.

The notes previews connect directly to the shared preview runtime. `preview/options.js` handles the five other widgets' shared reading controls; Refined keeps its row-preserving selection and Undo handling in `preview/demo.js`. Each widget remains self-contained. Update all affected copies when changing shared helpers, and rebuild with `make content`.

If changing list spacing or height hides the active native note, check `NoteList.qml` or Ash's `NotesStack.qml`: selection positioning must run after list layout. Character counts treat a Unicode surrogate pair as one code point in both preview and QML. Run the Quick notes browser cases and `make native-check WIDGET=<id>` for each affected widget after changing either behavior. Native checks use exact generated bundles in isolated directories.

## Fish in space

The fish swim independently and respond to clicks or taps on the canvas. Pointer movement does not steer them. Each click replaces the previous destinations and gives both fish a short speed burst. They approach separate spots beside the click, slow on arrival, and return to free swimming. Gather calls them to the center with the same spacing; a new click releases Gather and picks new destinations.

Pause freezes the simulation. With reduced motion enabled, press Play to start; clicks while paused only queue a destination. Enter or Space on the focused canvas calls the fish to the center. Particle trails are short tail wakes, so changing the setting does not leave repeated body images.

`preview/motion.js` contains the motion model and articulated backbone and is declared in this widget's public files. The swimming wave flexes the front of the body and grows toward the tail; fin movement follows that wave. Turns ease in at the head and pass through successive body sections. The renderer, tail wakes, and spacing envelopes use the same backbone. Envelopes include the fins and forked tail, predict approaching contact, and preserve clearance at the canvas edges. Narrow previews reduce body size to leave room for both fish.

Edge steering reserves room for the tail's turning arc and adapts its look-ahead to speed. A persistent passing side guides head-on approaches along the wall. The fish slow while approaching, and separation steering cannot push them outward through that boundary. Arrival also considers the head, avoiding a second push toward the edge after reaching the destination area. Positional containment remains a fallback for resizing and crowded contact.

Its Bun tests cover body movement, turn continuity, body length, click response, arrival, resizing, clearance during repeated clicks and Gather, and refresh-rate consistency. Dedicated wall and corner cases verify that each turn stays inside through swimming alone, without positional corrections. After changes, run `make content` and the Fish in space browser cases to verify interaction and rendering. The widget remains an HTML draft with export disabled.

## Distribution notices

The application uses Apache 2.0; original widgets use 0BSD. `make build` emits the root license as `LICENSE.txt`, the project notice as `NOTICE.txt`, and dependency notices as `THIRD_PARTY_LICENSES.txt`. Keep all three with a distributed site. Widget downloads carry their own licenses. If package metadata or the UI disagrees, check `docs/licensing.md`, `frontend/package.json`, `backend/Cargo.toml`, and the application's license label.
