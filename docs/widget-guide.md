# Author a widget

Discuss new designs with the maintainer before adding or porting a widget. Preserve its existing identity and behavior. Give each approved design its own widget entry. Keep palettes and tuning options as settings, and preserve the design's purpose. `widgets/lockscreens/phase-lock/formation/` keeps an existing interactive HTML design alongside its native visual component.

## Source files

Create `widgets/<category>/<name>/widget.json`, or use `<category>/<study>/<design>/` for a family of related designs. Use short lowercase folder names, such as `glyphs/branch-grammar` and `quick-notes/refined`. The `id` inside `widget.json` is the stable public identity; it uses lowercase letters, digits, and hyphens and must be unique across the library. For a new widget, use its folder path with each `/` replaced by `-`, such as `glyphs-branch-grammar`. Moving or renaming a source folder does not rename that ID or its URLs. Keep HTML in `preview/`, QML templates in `qml/`, assets used by both preview and export in `assets/`, a `thumbnail.webp`, and usage in `README.md`. The 0BSD `LICENSE` comes from `widgets/_shared/`; a widget with other terms keeps its own.

Discovery descends through category and study folders and stops at each `widget.json`. Do not put another widget inside a widget folder. Empty groups and symlinks in group folders are rejected; remove empty groups after deleting their last design. Hidden directories are ignored, and a group's `_shared/` folder is never a widget.

## Shared files

A category or study folder can hold a `_shared/` folder for files that several of its widgets use unchanged. Each declared `source` is looked up in the widget folder first, then in the `_shared/` folder of each parent group, nearest first, ending at `widgets/_shared/`. The mapping is written the same way in both cases. `qml/PlayerBase.qml` resolves to `widgets/player/_shared/qml/PlayerBase.qml` when the widget has no `qml/PlayerBase.qml` of its own. Each widget's output file list includes its own copy of every required file. A resolved path must stay inside the folder that supplied it.

`widgets/_shared/` holds the 0BSD `LICENSE` and the archive adapter `preview/support.js`. Each native family keeps its common QML helpers and launcher in its category's `_shared/qml/`; see that category's `README.md`. Keep `widget.json`, the preview entry, the thumbnail, and the README in the widget folder.

Editing a shared file changes every widget that uses it and gives each of them a new revision. To change one widget only, copy the file to the same relative path inside that widget folder and edit the copy. The widget's own file takes precedence. Move it back to `_shared/` when the change should apply to the whole group. Share a file only while it is byte-identical for every widget that uses it. Moving an identical file between a widget and `_shared/` does not change any revision.

Definitions supply title, summary, category, tags, status, preview and thumbnail paths, settings, public file mappings, and export mappings. Project defaults supply `formatVersion`, `settingsSchemaVersion`, and `license`. Override a version deliberately when a setting's meaning changes.

`publicFiles` maps `{ "source": "preview/index.html", "path": "preview/index.html" }`. Both paths are relative to the widget or revision respectively. `exports` adds `kind`, either `template` or `file`. A template typically maps `qml/Widget.qml.tmpl` to `Widget.qml`. Include every static QML helper, image, font, README, and license required by the exported widget. `source` is always written relative to the widget folder, including for files supplied by `_shared/`.

Paths cannot contain traversal, spaces, URL schemes, or escaping symlinks. Mappings must be unique and cannot make one file the parent of another. Public names `bundle.json`, `preview-runtime.js`, and `files/` are reserved for packaging. Files not listed are private source and will not be distributed. A file used both in preview and export needs both mappings.

## Settings and bindings

Each setting declares a unique key, label, type, and default. Number settings also declare `min`, `max`, and positive `step`; strings declare `maxLength`; enums declare `choices`. Colors use six-digit hex. Booleans have true/false defaults. Defaults must pass the same checks as user edits.

For example, this definition creates a slider and numeric input:

```json
{ "key": "level", "label": "Level", "type": "number", "default": 68, "min": 0, "max": 100, "step": 1 }
```

Bind it near the top of the QML template:

```qml
property int level: {{level}}
property string label: {{label}}
property color accent: {{accent}}
```

Declare every referenced setting. Each placeholder must occupy the complete property value on its own line. Do not quote a string placeholder or append an expression or comment to its line. Use `real` for fractional numbers. `int` requires integral constraints within the signed 32-bit range. Every setting must bind to at least one QML template when native output is supplied. Use `Text.PlainText` for customizable text rendered by QML `Text` items.

There are no widget-specific generator plugins. All exports go through `frontend/src/generator/`.

## Connect the preview

With the standard `preview/index.html` location, load these classic scripts at the end of the body:

```html
<script src="../preview-runtime.js"></script>
<script src="adapter.js"></script>
```

The adapter registers `window.ChaldeaPreview.connect(settings => { /* update DOM */ })`. Use `textContent` for user text and update every declared setting. Keep assets local. The provided previews use a content security policy and work with an opaque-origin iframe; module scripts and requests that require same-origin credentials are unsuitable here.

Controls inside the widget must remain usable with pointer and keyboard input. A customization sidebar is additional UI, not a replacement for those interactions. The shared runtime reports content height so the frame can show the complete interface. Quick Notes also declares a preferred width through the body's `data-preview-width` attribute, including its outer padding. Update that attribute when a setting changes the widget width. The parent authenticates and bounds resize messages.

Import each distinct design from a study page as a separate widget with its own ID, title, thumbnail, preview, and applicable settings. Remove design-switching controls from its preview. Palettes such as Bone/Charcoal remain settings. See [the design inventory](widget-inventory.md). Lockscreens use the full width with settings below, including after native promotion. Other HTML drafts use the full width except Glyphs, which retain the native Glyph preview layout. Connect the original design controls directly with `ChaldeaPreview.connect`; the runtime provides no `Tweak` helper or remote icon/font wrapper. Archive imports that need the original helper declare the 0BSD `preview/support.js` from `widgets/_shared/`, which maps the original controls to this connection and supplies local SVG icons. Native QML export requires complete export mappings.

The callback must apply settings synchronously. The runtime acknowledges successful rendering and reports callback errors. Timers inside a preview stop when its frame is destroyed. Implement and test corresponding behavior in QML separately.

## Drafts and publication

An HTML-only widget uses `status: "draft"` and `exports: []`. It still needs valid metadata, declared preview/thumbnail files, and valid supplied settings. It can appear in `make dev`, with native export unavailable. `make build` excludes all drafts.

Publish only after native QML, exported usage, and an exported `LICENSE` are complete. Original widget code uses 0BSD. Preserve third-party notices and include any additional assets and licenses in the output file list. Rust checks required file presence; it cannot establish ownership or prove native behavior.

## Verify the change

Run `make check`. It discovers new widgets automatically, runs the shared units, packages local and production content, and validates the packaged preview scripts/assets, settings, generated exports, and the production catalog. A running `make dev` keeps its drafts. Use `make test` when only the unit tests need rerunning. No widget-specific test files or test registration are needed.

Then use `make dev` to inspect a changed preview at desktop and narrow widths. Try its controls and copy/download flows. For native changes, inspect the generated QML and load the exact exported files in an isolated Quickshell configuration. The automatic check does not establish rendering, interaction, or desktop integration behavior. Record the revision, environment, and limitations before publishing native support.

To export without a browser, run `bun run export <id> <new-directory> [settings.json]` inside `frontend/`. Overrides are validated against the same definition. The destination must not already exist.

To refresh source thumbnails, keep `make dev` running and run `bun scripts/thumbnails.ts` inside `frontend/`. To update only selected entries, use `bun scripts/thumbnails.ts http://127.0.0.1:5175/ <id-or-source-path> [...]`, such as `glyphs/branch-grammar`. This captures WebP files from the actual previews. Then run `make content` again and review the images. Thumbnail changes produce new revisions.
